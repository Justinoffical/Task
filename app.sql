select role.role, firstname, lastname, peleton.peleton, kompani.kompani 
from user
inner join peleton on user.peleton_id = peleton.id
inner join kompani on peleton.kompani_id = kompani.id
inner join role on user.role_id = role.id

SELECT kompani, leader_id
from kompani
inner join user on kompani.leader_id = user.id

SELECT peleton, kompani.kompani
from peleton
inner join kompani on peleton.kompani_id = kompani.id

SELECT forelder_barn.forelder_id, forelder_barn.barn_id
FROM forelder_barn
INNER JOIN user AS forelder ON forelder_barn.forelder_id = forelder.id
INNER JOIN user AS barn ON forelder_barn.barn_id = barn.id;