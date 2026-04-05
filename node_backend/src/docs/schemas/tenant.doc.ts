/**
 * @openapi
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-0000-7000-0000-000000000001"
 *         type:
 *           type: string
 *           example: "tenant"
 *         attributes:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               example: "tenant@example.com"
 *             username:
 *               type: string
 *               example: "acme_corp"
 *             name:
 *               type: string
 *               example: "ACME Corporation"
 *             address:
 *               type: string
 *               example: "123 Main St, City"
 *             status:
 *               type: string
 *               enum: [active, blocked, suspended, deleted]
 *               example: "active"
 *             country:
 *               type: object
 *               nullable: true
 *               properties:
 *                 uuid: { type: string, format: uuid }
 *                 name: { type: string, example: "India" }
 *                 code: { type: string, example: "IN" }
 *                 phoneCode: { type: string, example: "+91" }
 *             role:
 *               type: object
 *               nullable: true
 *               properties:
 *                 uuid: { type: string, format: uuid }
 *                 name: { type: string, example: "Super Admin" }
 *                 slug: { type: string, example: "super-admin" }
 *         meta:
 *           type: object
 *           properties:
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *         links:
 *           type: object
 *           properties:
 *             self: { type: string, example: "/api/tenants/019d1eb5-..." }
 *
 *     TenantBusiness:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-0000-7000-0000-000000000002"
 *         type:
 *           type: string
 *           example: "tenant_business"
 *         attributes:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "ACME ISP"
 *             address:
 *               type: string
 *               example: "456 Network Ave, City"
 *             email:
 *               type: string
 *               format: email
 *               example: "contact@acme-isp.com"
 *             phone:
 *               type: string
 *               example: "9876543210"
 *             type:
 *               type: string
 *               enum: [operator, distributor]
 *               example: "operator"
 *             status:
 *               type: string
 *               enum: [active, blocked, suspended, deleted]
 *               example: "active"
 *             country:
 *               type: object
 *               nullable: true
 *               properties:
 *                 uuid: { type: string, format: uuid }
 *                 name: { type: string, example: "India" }
 *                 code: { type: string, example: "IN" }
 *                 phoneCode: { type: string, example: "+91" }
 *         meta:
 *           type: object
 *           properties:
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *         links:
 *           type: object
 *           properties:
 *             self: { type: string, example: "/api/tenant-business/019d1eb5-..." }
 */
export const TenantDoc = {};
