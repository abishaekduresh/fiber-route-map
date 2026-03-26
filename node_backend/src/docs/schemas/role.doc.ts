/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-..."
 *         type:
 *           type: string
 *           example: "role"
 *         attributes:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Administrator"
 *             slug:
 *               type: string
 *               example: "admin"
 *             description:
 *               type: string
 *               example: "Full system access"
 *             status:
 *               type: string
 *               enum: [active, inactive]
 *               example: "active"
 */
export const RoleDoc = {};
