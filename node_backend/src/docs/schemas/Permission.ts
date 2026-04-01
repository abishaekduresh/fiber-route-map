/**
 * @openapi
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-88ac-772d-b30c-816140772535"
 *         type:
 *           type: string
 *           example: "permission"
 *         attributes:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "View Users"
 *             slug:
 *               type: string
 *               example: "user.view"
 *             description:
 *               type: string
 *               nullable: true
 *               example: "Can view user list and details"
 *             resource:
 *               type: string
 *               example: "user"
 *         meta:
 *           type: object
 *           properties:
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2026-03-24T06:44:05.000Z"
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: "2026-03-24T06:44:05.000Z"
 *         links:
 *           type: object
 *           properties:
 *             self:
 *               type: string
 *               example: "/api/permissions/019d1eb5-88ac-772d-b30c-816140772535"
 */
export {};
