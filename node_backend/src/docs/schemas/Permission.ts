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
 *             resource:
 *               type: string
 *               example: "user"
 */
export {};
