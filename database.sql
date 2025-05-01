CREATE TABLE `vehicles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plate` VARCHAR(10) NOT NULL,
  `model` VARCHAR(50) NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `customizations` JSON DEFAULT NULL,
  `owner` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plate` (`plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO vehicles (plate, model, color, customizations, owner) VALUES
('ADC727', 'adder', '#de0f18', '{"secondaryColor": "#0b9cf1", "mods": {"engine": 3}}', 'steam:1100001128bc535'),
('COM821', 'comet2', '#f1cc40', '{"secondaryColor": "#f21f99", "mods": {"engine": 3}}', 'steam:1100001128bc535');
('ZET928', 'zentorno', '#1b6770', '{"mods": {"engine": 3}}', 'steam:1100001128bc535'),