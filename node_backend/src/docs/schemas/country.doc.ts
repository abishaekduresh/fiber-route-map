/**
 * @openapi
 * components:
 *   schemas:
 *     Country:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "019d1eb5-..."
 *         type:
 *           type: string
 *           example: "country"
 *         attributes:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "India"
 *             code:
 *               type: string
 *               example: "IN"
 *             phoneCode:
 *               type: string
 *               example: "+91"
 *             status:
 *               type: string
 *               enum: [active, inactive]
 *               example: "active"
 */
export const CountryDoc = {};
