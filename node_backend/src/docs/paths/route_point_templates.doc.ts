/**
 * @openapi
 * /route-point-templates:
 *   get:
 *     tags:
 *       - Route Point Templates
 *     summary: List route point templates
 *     description: Returns all global route point templates with linked icon and device type details. Requires `route_point_templates.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Templates listed
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Route point templates retrieved successfully"
 *               data:
 *                 - id: "019f1ab2-0000-7000-0000-000000000010"
 *                   type: "route_point_template"
 *                   attributes:
 *                     code: "RPT0001"
 *                     name: "Electric Pole"
 *                     iconId: 1
 *                     iconName: "Pole Icon"
 *                     iconCode: "ICO0001"
 *                     iconFileType: "svg"
 *                     iconSvgTemplate: "<svg>…</svg>"
 *                     iconUrl: null
 *                     deviceTypeId: 2
 *                     deviceTypeName: "Electric Pole Type"
 *                     deviceTypeCode: "DT0002"
 *                     isDevice: true
 *                     isPointNameRequired: true
 *                     isPoleNumberRequired: true
 *                     isLandmarkRequired: false
 *                     isAddressRequired: false
 *                     isPhotoRequired: false
 *                     isHeightRequired: true
 *                     isOwnerNameRequired: false
 *                     isContactNumberRequired: false
 *                     isElectricityAvailable: true
 *                     description: "Standard electric utility pole"
 *                     status: "active"
 *                   meta:
 *                     createdAt: "2026-05-14T10:00:00.000Z"
 *                     updatedAt: "2026-05-14T10:00:00.000Z"
 *               meta:
 *                 pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
 *   post:
 *     tags:
 *       - Route Point Templates
 *     summary: Create a route point template
 *     description: Requires `route_point_templates.create`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Electric Pole" }
 *               iconId: { type: integer, nullable: true }
 *               deviceTypeId: { type: integer, nullable: true }
 *               isDevice: { type: boolean, default: false }
 *               isPointNameRequired: { type: boolean, default: true }
 *               isPoleNumberRequired: { type: boolean, default: false }
 *               isLandmarkRequired: { type: boolean, default: false }
 *               isAddressRequired: { type: boolean, default: false }
 *               isPhotoRequired: { type: boolean, default: false }
 *               isHeightRequired: { type: boolean, default: false }
 *               isOwnerNameRequired: { type: boolean, default: false }
 *               isContactNumberRequired: { type: boolean, default: false }
 *               isElectricityAvailable: { type: boolean, default: false }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Template created
 *       422:
 *         description: Validation error
 *
 * /route-point-templates/{uuid}:
 *   get:
 *     tags:
 *       - Route Point Templates
 *     summary: Get a route point template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template retrieved
 *       404:
 *         description: Not found
 *   put:
 *     tags:
 *       - Route Point Templates
 *     summary: Update a route point template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               iconId: { type: integer, nullable: true }
 *               deviceTypeId: { type: integer, nullable: true }
 *               isDevice: { type: boolean }
 *               isPointNameRequired: { type: boolean }
 *               isPoleNumberRequired: { type: boolean }
 *               isLandmarkRequired: { type: boolean }
 *               isAddressRequired: { type: boolean }
 *               isPhotoRequired: { type: boolean }
 *               isHeightRequired: { type: boolean }
 *               isOwnerNameRequired: { type: boolean }
 *               isContactNumberRequired: { type: boolean }
 *               isElectricityAvailable: { type: boolean }
 *               description: { type: string, nullable: true }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags:
 *       - Route Point Templates
 *     summary: Delete a route point template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         description: Not found
 */

export default {};
