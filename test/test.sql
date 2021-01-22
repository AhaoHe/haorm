/*
 Navicat Premium Data Transfer

 Source Server         : localMysql
 Source Server Type    : MySQL
 Source Server Version : 50733
 Source Host           : localhost:3306
 Source Schema         : test

 Target Server Type    : MySQL
 Target Server Version : 50733
 File Encoding         : 65001

 Date: 22/01/2021 17:38:26
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for b_group
-- ----------------------------
DROP TABLE IF EXISTS `b_group`;
CREATE TABLE `b_group`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `g_name` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `g_status` tinyint(1) NULL DEFAULT NULL COMMENT '3表示正常，7表示删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of b_group
-- ----------------------------
INSERT INTO `b_group` VALUES (1, 'Admin', 3);

-- ----------------------------
-- Table structure for b_user
-- ----------------------------
DROP TABLE IF EXISTS `b_user`;
CREATE TABLE `b_user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `u_login` varchar(64) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `u_passwd` varchar(64) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `u_nickname` varchar(64) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `u_mail` varchar(64) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `g_id` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UNIQUE_LOGIN_NAME`(`u_login`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of b_user
-- ----------------------------
INSERT INTO `b_user` VALUES (1, 'admin', 'admin', 'admin', 'admin@qq.com', 1);
INSERT INTO `b_user` VALUES (30, 'test5', 'test4', NULL, 'test@qq.com', NULL);
INSERT INTO `b_user` VALUES (32, 'test123', '123', NULL, '8484@qq.com', NULL);
INSERT INTO `b_user` VALUES (35, 'ahh', '123456', NULL, '8484@qq.com', NULL);

SET FOREIGN_KEY_CHECKS = 1;
