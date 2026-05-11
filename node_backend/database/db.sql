-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.1.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for fiber_route_map
CREATE DATABASE IF NOT EXISTS `fiber_route_map` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `fiber_route_map`;

-- Dumping structure for table fiber_route_map.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `actorType` enum('user','system','anonymous') NOT NULL DEFAULT 'anonymous',
  `actorUuid` varchar(36) DEFAULT NULL,
  `actorName` varchar(255) DEFAULT NULL,
  `actorEmail` varchar(191) DEFAULT NULL,
  `actorRoles` json DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `resourceUuid` varchar(36) DEFAULT NULL,
  `resourceName` varchar(255) DEFAULT NULL,
  `httpMethod` varchar(10) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `statusCode` smallint unsigned NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '1',
  `requestBody` json DEFAULT NULL,
  `responseBody` json DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  `requestId` varchar(100) DEFAULT NULL,
  `sessionUuid` varchar(36) DEFAULT NULL,
  `durationMs` int unsigned NOT NULL DEFAULT '0',
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_logs_uuid_unique` (`uuid`),
  KEY `idx_audit_actor_uuid` (`actorUuid`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_resource` (`resource`),
  KEY `idx_audit_created` (`createdAt`),
  KEY `idx_audit_status_code` (`statusCode`),
  KEY `idx_audit_ip` (`ipAddress`),
  KEY `idx_audit_request_id` (`requestId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.countries
CREATE TABLE IF NOT EXISTS `countries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `phoneCode` varchar(10) NOT NULL,
  `status` enum('active','blocked','deleted') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `countries_uuid_unique` (`uuid`),
  UNIQUE KEY `countries_code_unique` (`code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `resource` varchar(100) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_uuid_unique` (`uuid`),
  UNIQUE KEY `permissions_slug_unique` (`slug`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text,
  `showForTenants` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_uuid_unique` (`uuid`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `roleId` int unsigned NOT NULL,
  `permissionId` int unsigned NOT NULL,
  PRIMARY KEY (`roleId`,`permissionId`),
  KEY `role_permissions_permissionid_foreign` (`permissionId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenants
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '000-0000',
  `address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryId` int unsigned NOT NULL,
  `roleId` int unsigned NOT NULL,
  `tenantBusinessId` int unsigned DEFAULT NULL,
  `status` enum('active','blocked','suspended','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sessionLimit` int NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT (now()),
  `updatedAt` datetime NOT NULL DEFAULT (now()),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uuid` (`uuid`) USING BTREE,
  KEY `FK_tenants_roles` (`roleId`) USING BTREE,
  KEY `FK_tenants_countries` (`countryId`) USING BTREE,
  KEY `tenants_tenantbusinessid_foreign` (`tenantBusinessId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_business
CREATE TABLE IF NOT EXISTS `tenant_business` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` bigint NOT NULL,
  `countryId` int NOT NULL,
  `type` enum('operator','distributor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','blocked','suspended','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT (now()),
  `updatedAt` datetime NOT NULL DEFAULT (now()),
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `FK_tenant_business_countries` (`countryId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_cable_types
CREATE TABLE IF NOT EXISTS `tenant_cable_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantBusinessId` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `tubeCount` int unsigned NOT NULL DEFAULT '1',
  `fiberCoreCount` int unsigned NOT NULL,
  `cableDiameter` decimal(5,2) NOT NULL,
  `description` text,
  `status` enum('active','inactive','blocked','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_cable_types_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_cable_types_business_code` (`tenantBusinessId`,`code`),
  KEY `idx_cable_types_business_id` (`tenantBusinessId`),
  KEY `idx_cable_types_status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_device_categories
CREATE TABLE IF NOT EXISTS `tenant_device_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantBusinessId` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_device_categories_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_device_categories_business_code` (`tenantBusinessId`,`code`),
  KEY `idx_device_categories_business_id` (`tenantBusinessId`),
  KEY `idx_device_categories_status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_device_types
CREATE TABLE IF NOT EXISTS `tenant_device_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantBusinessId` bigint unsigned NOT NULL,
  `tenantDeviceCategoryId` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `isModelNumberRequired` tinyint(1) NOT NULL DEFAULT '0',
  `isSerialNumberRequired` tinyint(1) NOT NULL DEFAULT '0',
  `isMacAddressRequired` tinyint(1) NOT NULL DEFAULT '0',
  `isIPAddressRequired` tinyint(1) NOT NULL DEFAULT '0',
  `isGpsLocationRequired` tinyint(1) NOT NULL DEFAULT '0',
  `description` text,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_device_types_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_device_types_business_code` (`tenantBusinessId`,`code`),
  KEY `idx_device_types_business_id` (`tenantBusinessId`),
  KEY `idx_device_types_category_id` (`tenantDeviceCategoryId`),
  KEY `idx_device_types_status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_lcos
CREATE TABLE IF NOT EXISTS `tenant_lcos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantId` int unsigned NOT NULL,
  `tenantBusinessId` int unsigned NOT NULL,
  `businessName` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `lcoName` varchar(255) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `email` varchar(191) NOT NULL,
  `address_line1` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(20) NOT NULL,
  `countryId` int unsigned DEFAULT NULL,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_lcos_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_lcos_business_code` (`tenantBusinessId`,`code`),
  KEY `idx_lcos_tenant_id` (`tenantId`),
  KEY `idx_lcos_business_id` (`tenantBusinessId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_sessions
CREATE TABLE IF NOT EXISTS `tenant_sessions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantId` int NOT NULL,
  `sessionToken` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `deviceName` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_refresh_tokens_token_unique` (`sessionToken`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_support_tickets
CREATE TABLE IF NOT EXISTS `tenant_support_tickets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantId` int unsigned NOT NULL,
  `tenantBusinessId` int unsigned NOT NULL,
  `ticketNumber` varchar(30) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('network','fiber','iptv','billing','account','technical','other') NOT NULL DEFAULT 'other',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `impactLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('open','assigned','in_progress','on_hold','resolved','closed','reopened') NOT NULL DEFAULT 'open',
  `assignedTo` int unsigned DEFAULT NULL,
  `assignedAt` datetime DEFAULT NULL,
  `slaResponseTime` int unsigned DEFAULT NULL,
  `slaResolutionTime` int unsigned DEFAULT NULL,
  `dueAt` datetime DEFAULT NULL,
  `relatedNodeId` varchar(36) DEFAULT NULL,
  `relatedRouteId` varchar(36) DEFAULT NULL,
  `relatedCustomerId` varchar(36) DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `resolutionNotes` text,
  `resolvedAt` datetime DEFAULT NULL,
  `closedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_support_tickets_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_support_tickets_ticketnumber_unique` (`ticketNumber`),
  KEY `idx_tickets_tenant_id` (`tenantId`),
  KEY `idx_tickets_business_id` (`tenantBusinessId`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_priority` (`priority`),
  KEY `idx_tickets_assigned_to` (`assignedTo`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_ticket_logs
CREATE TABLE IF NOT EXISTS `tenant_ticket_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticketId` int unsigned NOT NULL,
  `action` varchar(100) NOT NULL,
  `oldValue` varchar(500) DEFAULT NULL,
  `newValue` varchar(500) DEFAULT NULL,
  `performedBy` int unsigned DEFAULT NULL,
  `performerName` varchar(255) DEFAULT NULL,
  `performedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_logs_ticket_id` (`ticketId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_ticket_messages
CREATE TABLE IF NOT EXISTS `tenant_ticket_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticketId` int unsigned NOT NULL,
  `senderType` enum('tenant','admin','system') NOT NULL,
  `senderId` int unsigned NOT NULL,
  `message` text NOT NULL,
  `attachments` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_messages_ticket_id` (`ticketId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_upstream_providers
CREATE TABLE IF NOT EXISTS `tenant_upstream_providers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantBusinessId` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(20) NOT NULL,
  `serviceCategory` enum('cabletv','bandwidth','iptv','hybrid') NOT NULL,
  `contactPerson` varchar(255) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `email` varchar(191) NOT NULL,
  `addressLine1` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `countryId` int unsigned DEFAULT NULL,
  `status` enum('active','inactive','blocked','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_upstream_providers_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_upstream_providers_business_code` (`tenantBusinessId`,`code`),
  UNIQUE KEY `uq_upstream_providers_business_email` (`tenantBusinessId`,`email`),
  UNIQUE KEY `uq_upstream_providers_business_phone` (`tenantBusinessId`,`phone`),
  KEY `idx_upstream_providers_business_id` (`tenantBusinessId`),
  KEY `idx_upstream_providers_status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_users
CREATE TABLE IF NOT EXISTS `tenant_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantId` int unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `countryId` int unsigned DEFAULT NULL,
  `tenantBusinessId` int unsigned DEFAULT NULL,
  `roleId` int unsigned DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','blocked') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_users_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_tenant_users_email` (`tenantId`,`email`),
  UNIQUE KEY `uq_tenant_users_username` (`tenantId`,`username`),
  KEY `idx_tenant_users_tenant_id` (`tenantId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.tenant_user_settings
CREATE TABLE IF NOT EXISTS `tenant_user_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenantBusinessId` bigint unsigned NOT NULL,
  `tenantUserId` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_user_settings_uuid_unique` (`uuid`),
  UNIQUE KEY `uq_user_settings_key` (`tenantBusinessId`,`tenantUserId`,`key`),
  KEY `idx_user_settings_user` (`tenantBusinessId`,`tenantUserId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `username` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` enum('active','blocked','suspended','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active',
  `countryId` int DEFAULT NULL,
  `sessionLimit` int NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_uuid_unique` (`uuid`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_phone_unique` (`phone`),
  KEY `users_countryid_foreign` (`countryId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.user_identities
CREATE TABLE IF NOT EXISTS `user_identities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `provider` enum('local','google','github') NOT NULL DEFAULT 'local',
  `providerUserId` varchar(191) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_identities_provider_provideruserid_unique` (`provider`,`providerUserId`),
  KEY `user_identities_userid_foreign` (`userId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.user_roles
CREATE TABLE IF NOT EXISTS `user_roles` (
  `userId` int unsigned NOT NULL,
  `roleId` int unsigned NOT NULL,
  PRIMARY KEY (`userId`,`roleId`),
  KEY `user_roles_roleid_foreign` (`roleId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table fiber_route_map.user_sessions
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `userId` int unsigned NOT NULL,
  `sessionToken` varchar(191) NOT NULL,
  `deviceId` varchar(255) DEFAULT NULL,
  `deviceName` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_sessions_uuid_unique` (`uuid`),
  UNIQUE KEY `user_sessions_sessiontoken_unique` (`sessionToken`),
  KEY `user_sessions_userid_foreign` (`userId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
