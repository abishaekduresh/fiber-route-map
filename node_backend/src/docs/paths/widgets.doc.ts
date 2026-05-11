/**
 * @swagger
 * tags:
 *   name: Widgets
 *   description: Map widget management (icons used on the fiber route map canvas)
 */

/**
 * @swagger
 * /widgets:
 *   get:
 *     summary: List all widgets
 *     tags: [Widgets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or code
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: filter[type]
 *         schema:
 *           type: string
 *           enum: [active_device, passive_device, power_device, junction, fiber_terminal, splitter, coupler]
 *     responses:
 *       200:
 *         description: Widget list retrieved
 *
 *   post:
 *     summary: Create a widget
 *     tags: [Widgets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, type, iconType, width, height]
 *             properties:
 *               code:        { type: string, example: "OLT-01" }
 *               name:        { type: string, example: "OLT Terminal" }
 *               type:
 *                 type: string
 *                 enum: [active_device, passive_device, power_device, junction, fiber_terminal, splitter, coupler]
 *               iconType:    { type: string, enum: [svg, png, webp] }
 *               svgTemplate: { type: string, nullable: true }
 *               iconUrl:     { type: string, nullable: true }
 *               width:       { type: integer, example: 48 }
 *               height:      { type: integer, example: 48 }
 *     responses:
 *       200:
 *         description: Widget created successfully (statusCode 201 in body)
 *       409:
 *         description: Code already exists
 *
 * /widgets/{uuid}:
 *   get:
 *     summary: Get a single widget
 *     tags: [Widgets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Widget retrieved
 *       404:
 *         description: Widget not found
 *
 *   put:
 *     summary: Update a widget
 *     tags: [Widgets]
 *     security:
 *       - BearerAuth: []
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
 *               code:        { type: string }
 *               name:        { type: string }
 *               type:
 *                 type: string
 *                 enum: [active_device, passive_device, power_device, junction, fiber_terminal, splitter, coupler]
 *               iconType:    { type: string, enum: [svg, png, webp] }
 *               svgTemplate: { type: string, nullable: true }
 *               iconUrl:     { type: string, nullable: true }
 *               width:       { type: integer }
 *               height:      { type: integer }
 *               status:      { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Widget updated
 *       404:
 *         description: Widget not found
 *       409:
 *         description: Code already exists
 *
 *   delete:
 *     summary: Soft-delete a widget
 *     tags: [Widgets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Widget deleted
 *       404:
 *         description: Widget not found
 */
