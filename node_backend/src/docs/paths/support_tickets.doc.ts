/**
 * @openapi
 * /tenant/support-tickets:
 *   get:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: List tickets
 *     description: Returns all support tickets for the authenticated tenant. Requires `support_ticket.view`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, example: -1 }
 *         description: Use -1 to return all records
 *       - in: query
 *         name: filter[status]
 *         schema: { type: string, enum: [all, open, assigned, in_progress, on_hold, resolved, closed, reopened] }
 *       - in: query
 *         name: filter[priority]
 *         schema: { type: string, enum: [all, low, medium, high, critical] }
 *       - in: query
 *         name: filter[category]
 *         schema: { type: string, enum: [all, network, fiber, iptv, billing, account, technical, other] }
 *       - in: query
 *         name: filter[search]
 *         schema: { type: string }
 *         description: Search by subject or ticket number
 *     responses:
 *       200:
 *         description: Tickets listed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Tickets retrieved successfully"
 *               data:
 *                 - id: "019d1eb5-0000-7000-0000-000000000050"
 *                   type: "support_ticket"
 *                   attributes:
 *                     ticketNumber: "TKT-2026-0001"
 *                     subject: "No internet connectivity"
 *                     category: "network"
 *                     priority: "high"
 *                     impactLevel: "high"
 *                     status: "open"
 *                     slaResponseTime: 240
 *                     slaResolutionTime: 480
 *                     dueAt: "2026-05-04T18:00:00.000Z"
 *               meta:
 *                 pagination:
 *                   total: 1
 *                   count: 1
 *                   perPage: 10
 *                   currentPage: 1
 *                   totalPages: 1
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *
 *   post:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Create ticket
 *     description: |
 *       Raises a new support ticket. SLA times and `dueAt` are auto-calculated from priority.
 *       - `ticketNumber` is auto-generated as `TKT-YYYY-XXXX`.
 *       - Default priority: `medium`. Default impactLevel: `medium`.
 *       Requires `support_ticket.create`.
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
 *             required: [subject, description, category]
 *             properties:
 *               subject:          { type: string, example: "No internet connectivity" }
 *               description:      { type: string, example: "All customers in zone 3 offline since 10am." }
 *               category:         { type: string, enum: [network, fiber, iptv, billing, account, technical, other] }
 *               priority:         { type: string, enum: [low, medium, high, critical], default: medium }
 *               impactLevel:      { type: string, enum: [low, medium, high], default: medium }
 *               relatedNodeId:    { type: string, nullable: true }
 *               relatedRouteId:   { type: string, nullable: true }
 *               relatedCustomerId: { type: string, nullable: true }
 *               attachments:      { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *
 * /tenant/support-tickets/{uuid}:
 *   get:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Get ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket retrieved
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Update ticket
 *     description: Tenants can update subject, description, category, priority, impactLevel. Status transitions are validated. Requires `support_ticket.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *               subject:     { type: string }
 *               description: { type: string }
 *               category:    { type: string, enum: [network, fiber, iptv, billing, account, technical, other] }
 *               priority:    { type: string, enum: [low, medium, high, critical] }
 *               impactLevel: { type: string, enum: [low, medium, high] }
 *     responses:
 *       200:
 *         description: Ticket updated
 *       422:
 *         description: Invalid status transition
 *
 * /tenant/support-tickets/{uuid}/close:
 *   post:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Close ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket closed
 *
 * /tenant/support-tickets/{uuid}/messages:
 *   get:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Get messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages retrieved
 *
 *   post:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Add message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *             required: [message]
 *             properties:
 *               message:     { type: string }
 *               attachments: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Message added
 *
 * /tenant/support-tickets/{uuid}/logs:
 *   get:
 *     tags:
 *       - Support Tickets (Tenant)
 *     summary: Get activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Logs retrieved
 *
 * /support-tickets:
 *   get:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: List all tickets (admin)
 *     description: Returns all support tickets across all tenants. Requires `support_ticket.view`.
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
 *         name: filter[status]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[priority]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[category]
 *         schema: { type: string }
 *       - in: query
 *         name: filter[search]
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tickets listed
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *
 * /support-tickets/{uuid}:
 *   get:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: Get ticket (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket retrieved
 *       404:
 *         $ref: '#/components/responses/404NotFound'
 *
 *   put:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: Update ticket (admin)
 *     description: Admin can update status, assignedTo, resolutionNotes, resolvedAt, closedAt. Status transitions are validated. Requires `support_ticket.update`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *               status:          { type: string, enum: [assigned, in_progress, on_hold, resolved, closed, reopened] }
 *               assignedTo:      { type: integer, nullable: true, description: "User ID of admin to assign" }
 *               assignedAt:      { type: string, format: date-time, nullable: true }
 *               resolutionNotes: { type: string, nullable: true }
 *               resolvedAt:      { type: string, format: date-time, nullable: true }
 *               closedAt:        { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Ticket updated
 *       422:
 *         description: Invalid status transition
 *
 * /support-tickets/{uuid}/messages:
 *   get:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: Get messages (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages retrieved
 *
 *   post:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: Add message (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
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
 *             required: [message]
 *             properties:
 *               message:     { type: string }
 *               attachments: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Message added
 *
 * /support-tickets/{uuid}/logs:
 *   get:
 *     tags:
 *       - Support Tickets (Admin)
 *     summary: Get activity logs (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersionHeader'
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Logs retrieved
 */
