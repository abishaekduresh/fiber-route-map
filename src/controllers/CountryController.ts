import { Request, Response, NextFunction } from 'express';
import { CountryService } from '../services/CountryService.js';
import { Country } from '../models/Country.js';

export class CountryController {
  private service: CountryService;

  constructor(service: CountryService) {
    this.service = service;
  }

  private transformCountry = (country: Country) => {
    const { uuid, name, code, phone_code, status, createdAt, updatedAt } = country;
    return {
      id: uuid,
      type: 'country',
      attributes: {
        name,
        code,
        phone_code,
        status
      },
      meta: {
        createdAt,
        updatedAt
      },
      links: {
        self: `/api/countries/${uuid}`
      }
    };
  };

  private getMeta = (req: Request, filterObj: any, sortParam: any, extra = {}) => {
    const appliedFilters = { ...filterObj };
    let sort: { field: string; order: string }[] = [];
    if (typeof sortParam === 'string') {
      sort = sortParam.split(',').map((s: string) => {
        const desc = s.trim().startsWith('-');
        const field = desc ? s.trim().substring(1) : s.trim();
        return { field, order: desc ? 'desc' : 'asc' };
      });
    } else if (sortParam && typeof sortParam === 'object') {
      sort = [{
        field: sortParam.field || 'name',
        order: String(sortParam.order || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'
      }];
    } else {
      sort = [{ field: 'name', order: 'asc' }];
    }

    return {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
      version: 'v1',
      filters: appliedFilters,
      sort,
      ...extra
    };
  };

  private buildLink = (req: Request, params: any) => {
    const url = new URL(req.baseUrl, 'http://localhost');
    const filters = typeof params.filters === 'object' ? params.filters : {};
    const filter = typeof params.filter === 'object' ? params.filter : {};
    const mergedFilter = { ...filters, ...filter };

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || key === 'filter' || key === 'filters') return;
      if (typeof value !== 'object') {
        url.searchParams.append(key, String(value));
      }
    });

    Object.entries(mergedFilter).forEach(([fKey, fVal]) => {
      url.searchParams.append(`filter[${fKey}]`, String(fVal));
    });

    return `${url.pathname}${url.search}`;
  };

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) === -1 ? -1 : (Number(req.query.limit) || 10);
      const filters_param = typeof req.query.filters === 'object' ? req.query.filters as any : {};
      const filter_param = typeof req.query.filter === 'object' ? req.query.filter as any : {};
      const filterObj = { ...filters_param, ...filter_param };
      const sortParam = req.query.sort;

      const { countries, total } = await this.service.getAllCountries({ ...req.query, filter: filterObj, page, limit });
      const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
      const transformedData = countries.map(c => this.transformCountry(c));

      res.json({
        success: true,
        statusCode: 200,
        message: transformedData.length > 0 ? 'Countries retrieved successfully' : 'No countries found matching the criteria',
        data: transformedData,
        meta: this.getMeta(req, filterObj, sortParam, {
          pagination: {
            total,
            count: transformedData.length,
            perPage: limit === -1 ? total : limit,
            currentPage: page,
            totalPages
          }
        }),
        links: {
          self: this.buildLink(req, { ...req.query, page, limit }),
          next: page < totalPages ? this.buildLink(req, { ...req.query, page: page + 1, limit }) : null,
          prev: page > 1 ? this.buildLink(req, { ...req.query, page: page - 1, limit }) : null
        }
      });
    } catch (error) {
      next(error);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const country = await this.service.getCountryByUuid(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        data: this.transformCountry(country),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        const error = new Error('Country data is required in request body');
        (error as any).status = 400;
        throw error;
      }
      const country = await this.service.createCountry(req.body);
      res.json({
        success: true,
        statusCode: 201,
        message: 'Country created successfully',
        data: this.transformCountry(country),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const country = await this.service.updateCountry(req.params.uuid as string, req.body);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Country updated successfully',
        data: this.transformCountry(country),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteCountry(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Country deleted successfully',
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const country = await this.service.blockCountry(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Country blocked successfully',
        data: this.transformCountry(country),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };

  unblock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const country = await this.service.unblockCountry(req.params.uuid as string);
      res.json({
        success: true,
        statusCode: 200,
        message: 'Country unblocked successfully',
        data: this.transformCountry(country),
        meta: this.getMeta(req, {}, null)
      });
    } catch (error) {
      next(error);
    }
  };
}
