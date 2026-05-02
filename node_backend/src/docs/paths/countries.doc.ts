/**
 * @openapi
 * /countries:
 *   get:
 *     tags:
 *       - Countries
 *     summary: List Countries
 *     description: Retrieve all countries with filtering and pagination. Requires `country.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, example: 10 }
 *       - in: query
 *         name: filter[name]
 *         schema: { type: string, example: "India" }
 *       - in: query
 *         name: filter[code]
 *         schema: { type: string, example: "IN" }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, blocked] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "name" }
 *         description: "Field to sort by. Prefix with - for descending"
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Countries retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000001"
 *                   type: "country"
 *                   attributes:
 *                     name: "India"
 *                     code: "IN"
 *                     phoneCode: "+91"
 *                     status: "active"
 *                 - id: "019d1eb5-0000-7000-0000-000000000002"
 *                   type: "country"
 *                   attributes:
 *                     name: "United States"
 *                     code: "US"
 *                     phoneCode: "+1"
 *                     status: "active"
 *               meta:
 *                 pagination:
 *                   total: 2
 *                   count: 2
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   post:
 *     tags:
 *       - Countries
 *     summary: Create Country
 *     description: Create a new country entry. Requires `country.create`.
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
 *               name: { type: string, example: "United States" }
 *               code: { type: string, example: "US" }
 *               phoneCode: { type: string, example: "+1" }
 *           example:
 *             name: "United States"
 *             code: "US"
 *             phoneCode: "+1"
 *     responses:
 *       201:
 *         description: Country created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "Country created successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000002"
 *                 type: "country"
 *                 attributes:
 *                   name: "United States"
 *                   code: "US"
 *                   phoneCode: "+1"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       409:
 *         description: Country code already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 409
 *               errorType: "CONFLICT"
 *               message: "A country with code 'US' already exists."
 *       422:
 *         $ref: '#/components/responses/422ValidationError'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /countries/{uuid}:
 *   get:
 *     tags:
 *       - Countries
 *     summary: Get Country Details
 *     description: Retrieve a specific country by UUID. Requires `country.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Country retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "country"
 *                 attributes:
 *                   name: "India"
 *                   code: "IN"
 *                   phoneCode: "+91"
 *                   status: "active"
 *                 meta:
 *                   createdAt: "2026-03-24T06:44:05.000Z"
 *                   updatedAt: "2026-03-24T06:44:05.000Z"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         description: Country not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               statusCode: 404
 *               errorType: "NOT_FOUND"
 *               message: "Country not found."
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   put:
 *     tags:
 *       - Countries
 *     summary: Update Country
 *     description: Update a country's details. Requires `country.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Republic of India" }
 *               phoneCode: { type: string, example: "+91" }
 *               status: { type: string, enum: [active, blocked], example: "active" }
 *           example:
 *             name: "Republic of India"
 *             phoneCode: "+91"
 *     responses:
 *       200:
 *         description: Country updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Country updated successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "country"
 *                 attributes:
 *                   name: "Republic of India"
 *                   code: "IN"
 *                   phoneCode: "+91"
 *                   status: "active"
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 *   delete:
 *     tags:
 *       - Countries
 *     summary: Delete Country
 *     description: Delete a country by UUID. Requires `country.delete`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Country deleted
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Country deleted successfully"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /countries/{uuid}/block:
 *   post:
 *     tags:
 *       - Countries
 *     summary: Block Country
 *     description: Sets country status to `blocked`. Requires `country.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Country blocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Country blocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "country"
 *                 attributes:
 *                   name: "India"
 *                   code: "IN"
 *                   phoneCode: "+91"
 *                   status: "blocked"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 *
 * /countries/{uuid}/unblock:
 *   put:
 *     tags:
 *       - Countries
 *     summary: Unblock Country
 *     description: Restores a blocked country to `active`. Requires `country.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string, format: uuid }
 *         example: "019d1eb5-0000-7000-0000-000000000001"
 *     responses:
 *       200:
 *         description: Country unblocked
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Country unblocked successfully"
 *               data:
 *                 id: "019d1eb5-0000-7000-0000-000000000001"
 *                 type: "country"
 *                 attributes:
 *                   name: "India"
 *                   code: "IN"
 *                   phoneCode: "+91"
 *                   status: "active"
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *       500:
 *         $ref: '#/components/responses/500InternalError'
 */
export const CountryPathDoc = {};
