-- 1_insert_initial_products.sql

INSERT INTO products (id, name, description, price, stability, portability, height, idealFor)
VALUES
  (1, 'Travel Bars', 'Cele mai mici și ușor de transportat. Perfecte pentru antrenamente oriunde.', 149, '★★', '★★★★★', 'Joasă', 'Sportivi aflați la început sau care călătoresc des'),
  (2, 'Core Bars', 'Echilibrul perfect între stabilitate și portabilitate. Modelul recomandat pentru majoritatea sportivilor.', 199, '★★★☆', '★★★★', 'Joasă', 'Antrenamente zilnice și progres constant'),
  (3, 'Tri Bars', 'Design triunghiular compact și stabil. Varianta unică pentru cei care vor portabilitate cu extra stabilitate.', 229, '★★★', '★★★☆', 'Joasă', 'Exerciții de bază, L-sit, flotări și skill-uri statice simple'),
  (4, 'Power Bars', 'Model robust, greu și foarte stabil. Construit pentru siguranță și intensitate maximă.', 279, '★★★★★', '★★', 'Medie', 'Sportivi care vor stabilitate maximă la antrenamentele grele'),
  (5, 'Pro Bars', 'Cele mai înalte, cu bază mare pentru handstand, planche și skill-uri avansate.', 349, '★★★★☆', '★★★', 'Înaltă', 'Sportivi avansați și antrenamente de forță statică');

insert into product_photos (product_id, url, alt_text, photo_order) values
(1, 'https://wingsappbucket.s3.eu-central-1.amazonaws.com/products/1/1755883519920-274494334.jpg', 'Travel Bars - Photo 1', 1),
(2, 'https://wingsappbucket.s3.eu-central-1.amazonaws.com/products/2/1755883388411-16037854.jpg', 'Core Bars - Photo 1', 1),
(3, 'https://wingsappbucket.s3.eu-central-1.amazonaws.com/products/3/1755883529456-843472328.jpg', 'Tri Bars - Photo 1', 1),
(4, 'https://wingsappbucket.s3.eu-central-1.amazonaws.com/products/4/1755883488060-201076251.jpg', 'Power Bars - Photo 1', 1),
(5, 'https://wingsappbucket.s3.eu-central-1.amazonaws.com/products/5/1755883497487-163976207.jpg', 'Pro Bars - Photo 1', 1),