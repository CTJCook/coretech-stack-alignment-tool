interface ConnectwiseCredentials {
  companyId: string;
  publicKey: string;
  privateKey: string;
  siteUrl: string;
  clientId: string;
}

interface CWCompany {
  id: number;
  identifier: string;
  name: string;
  status: { id: number; name: string };
  types?: { id: number; name: string }[];
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  phoneNumber?: string;
  website?: string;
  defaultContact?: {
    id: number;
    name: string;
  };
}

interface CWAgreement {
  id: number;
  name: string;
  company: { id: number; identifier: string; name: string };
  type: { id: number; name: string };
  cancelled?: boolean;
}

interface CWAgreementAddition {
  id: number;
  product: {
    id: number;
    identifier: string;
    description: string;
  };
  quantity: number;
  billableOption: string;
}

interface CWContact {
  id: number;
  firstName: string;
  lastName: string;
  communicationItems?: Array<{
    type: { id: number; name: string };
    value: string;
    defaultFlag: boolean;
  }>;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export class ConnectwiseApiClient {
  private credentials: ConnectwiseCredentials;
  private baseUrl: string;

  constructor(credentials: ConnectwiseCredentials) {
    this.credentials = credentials;
    let siteUrl = credentials.siteUrl.replace(/\/$/, '');
    if (!siteUrl.startsWith('https://') && !siteUrl.startsWith('http://')) {
      siteUrl = `https://${siteUrl}`;
    }
    this.baseUrl = `${siteUrl}/v4_6_release/apis/3.0`;
  }

  private getAuthHeader(): string {
    const authString = `${this.credentials.companyId}+${this.credentials.publicKey}:${this.credentials.privateKey}`;
    return `Basic ${Buffer.from(authString).toString('base64')}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      params?: Record<string, string>;
      body?: any;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params, body } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'clientId': this.credentials.clientId,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ConnectWise API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest<any>('/system/info');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async getCompanyTypes(): Promise<Array<{ id: number; name: string }>> {
    return this.makeRequest<Array<{ id: number; name: string }>>('/company/companies/types');
  }

  async getCompanies(options: {
    page?: number;
    pageSize?: number;
    conditions?: string;
  } = {}): Promise<PaginatedResponse<CWCompany>> {
    const { page = 1, pageSize = 100, conditions } = options;

    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };

    if (conditions) {
      params.conditions = conditions;
    }

    const companies = await this.makeRequest<CWCompany[]>('/company/companies', { params });

    const countParams: Record<string, string> = {};
    if (conditions) {
      countParams.conditions = conditions;
    }

    const countResponse = await this.makeRequest<{ count: number }>('/company/companies/count', { params: countParams });

    return {
      items: companies,
      totalCount: countResponse.count,
    };
  }

  async getCompanyById(companyId: number): Promise<CWCompany> {
    return this.makeRequest<CWCompany>(`/company/companies/${companyId}`);
  }

  async getCompanyContact(contactId: number): Promise<CWContact> {
    return this.makeRequest<CWContact>(`/company/contacts/${contactId}`);
  }

  async getAgreementsByCompany(companyId: number): Promise<CWAgreement[]> {
    const params: Record<string, string> = {
      conditions: `company/id=${companyId} and cancelled=false`,
      pageSize: '1000',
    };

    return this.makeRequest<CWAgreement[]>('/finance/agreements', { params });
  }

  async getAgreementAdditions(agreementId: number): Promise<CWAgreementAddition[]> {
    const params: Record<string, string> = {
      pageSize: '1000',
    };

    return this.makeRequest<CWAgreementAddition[]>(`/finance/agreements/${agreementId}/additions`, { params });
  }

  async getAllCompaniesWithPagination(
    conditions?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<CWCompany[]> {
    const pageSize = 100;
    let page = 1;
    let allCompanies: CWCompany[] = [];

    const firstPage = await this.getCompanies({ page, pageSize, conditions });
    allCompanies = [...firstPage.items];
    const totalCount = firstPage.totalCount;

    if (onProgress) {
      onProgress(allCompanies.length, totalCount);
    }

    while (allCompanies.length < totalCount) {
      page++;
      const nextPage = await this.getCompanies({ page, pageSize, conditions });
      allCompanies = [...allCompanies, ...nextPage.items];

      if (onProgress) {
        onProgress(allCompanies.length, totalCount);
      }

      if (nextPage.items.length === 0) {
        break;
      }
    }

    return allCompanies;
  }

  async getCompanyProductSKUs(companyId: number): Promise<string[]> {
    const agreements = await this.getAgreementsByCompany(companyId);
    const skuSet = new Set<string>();

    for (const agreement of agreements) {
      try {
        const additions = await this.getAgreementAdditions(agreement.id);
        for (const addition of additions) {
          if (addition.product?.identifier) {
            skuSet.add(addition.product.identifier);
          }
        }
      } catch (error) {
        console.warn(`Failed to get additions for agreement ${agreement.id}:`, error);
      }
    }

    return Array.from(skuSet);
  }
}

export function createConnectwiseClient(credentials: ConnectwiseCredentials): ConnectwiseApiClient {
  return new ConnectwiseApiClient(credentials);
}

export type { CWCompany, CWAgreement, CWAgreementAddition, CWContact };
