/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-..."
 *         type:
 *           type: string
 *           example: "user"
 *         attributes:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "user@example.com"
 *             username:
 *               type: string
 *               example: "jane_doe"
 *             name:
 *               type: string
 *               example: "Jane Doe"
 *             phone:
 *               type: string
 *               example: "1234567890"
 *             status:
 *               type: string
 *               enum: [active, blocked, deleted]
 *               example: "active"
 */
export const UserDoc = {};
