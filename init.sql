CREATE DATABASE IF NOT EXISTS rex_auth;
CREATE DATABASE IF NOT EXISTS rex_robot;
CREATE DATABASE IF NOT EXISTS rex_telemetry;
CREATE DATABASE IF NOT EXISTS rex_fusion;
CREATE DATABASE IF NOT EXISTS rex_navigation;
CREATE DATABASE IF NOT EXISTS rex_vision;
CREATE DATABASE IF NOT EXISTS rex_event;
CREATE DATABASE IF NOT EXISTS rex_notification;
CREATE DATABASE IF NOT EXISTS rex_voice;
CREATE DATABASE IF NOT EXISTS rex_agent;
CREATE DATABASE IF NOT EXISTS rex_memory;

CREATE USER IF NOT EXISTS 'thathsara'@'%' IDENTIFIED BY 'rex_password';

GRANT ALL PRIVILEGES ON rex_auth.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_robot.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_telemetry.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_fusion.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_navigation.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_vision.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_event.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_notification.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_voice.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_agent.* TO 'rex_user'@'%';
GRANT ALL PRIVILEGES ON rex_memory.* TO 'rex_user'@'%';

FLUSH PRIVILEGES;
