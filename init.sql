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

CREATE USER IF NOT EXISTS 'thathsara'@'%' IDENTIFIED BY 'BandaPutha';

GRANT ALL PRIVILEGES ON rex_auth.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_robot.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_telemetry.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_fusion.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_navigation.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_vision.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_event.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_notification.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_voice.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_agent.* TO 'thathsara'@'%';
GRANT ALL PRIVILEGES ON rex_memory.* TO 'thathsara'@'%';

FLUSH PRIVILEGES;
