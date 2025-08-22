UPDATE products SET
  stability = CASE name
    WHEN 'Travel Bars' THEN '★★★☆☆'
    WHEN 'Core Bars' THEN '★★★★☆'
    WHEN 'Tri Bars' THEN '★★★☆☆'
    WHEN 'Power Bars' THEN '★★★★★'
    WHEN 'Pro Bars' THEN '★★★★★'
    ELSE stability
  END,
  portability = CASE name
    WHEN 'Travel Bars' THEN '★★★★★'
    WHEN 'Core Bars' THEN '★★★★☆'
    WHEN 'Tri Bars' THEN '★★★★★'
    WHEN 'Power Bars' THEN '★★★☆☆'
    WHEN 'Pro Bars' THEN '★★☆☆☆'
    ELSE portability
  END,
  height = CASE name
    WHEN 'Travel Bars' THEN 'Joasă'
    WHEN 'Core Bars' THEN 'Joasă'
    WHEN 'Tri Bars' THEN 'Joasă'
    WHEN 'Power Bars' THEN 'Medie'
    WHEN 'Pro Bars' THEN 'Înaltă'
    ELSE height
  END,
  idealFor = CASE name
    WHEN 'Travel Bars' THEN 'Sportivi aflați la început sau care călătoresc des'
    WHEN 'Core Bars' THEN 'Antrenamente zilnice și progres constant'
    WHEN 'Tri Bars' THEN 'Pentru cei care doresc un design unic și diferit'
    WHEN 'Power Bars' THEN 'Sportivi care vor stabilitate maximă la antrenamentele grele'
    WHEN 'Pro Bars' THEN 'Sportivi avansați și antrenamente de forță statică'
    ELSE idealFor
  END;