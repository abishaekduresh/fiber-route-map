/**
 * @openapi
 * /countries:
 *   get:
 *     tags:
 *       - Countries
 *     summary: List Countries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[code]
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "name" }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Country' } }
 *
 *   post:
 *     tags:
 *       - Countries
 *     summary: Create Country
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, phoneCode]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               phoneCode: { type: string }
 *     responses:
 *       201:
 *         description: Country created
 *
 * /countries/{uuid}:
 *   get:
 *     tags:
 *       - Countries
 *     summary: Get Country Detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Success
 *
 *   put:
 *     tags:
 *       - Countries
 *     summary: Update Country
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phoneCode: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Country updated
 *
 *   delete:
 *     tags:
 *       - Countries
 *     summary: Delete Country
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Country deleted
 */
export const CountryPathDoc = {};
