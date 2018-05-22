Une fois cloné

Vérifier que vous avez bien un dossier data/db à la racine du pc pour mongo
Lancer mongo -> start /d "C:\Program Files\MongoDB\Server\3.6\bin" mongod.exe -storageEngine=mmapv1 -dbpath D:\{{votre chemin}}\data\db

Dans le projet

npm install

npm run build
npm run start -dev

L'api est trouvable à l'adresse : http://localhost:4187/docs/

Pour créer l'administrateur en base
Appeler la route /auth/register sur swagger (localhost:4187/docs)

Si erreur 'no administrator found', allez dans votre base mongo (avec studio3T ou mongoui par ex...) puis dans la table users, modifier l'utilisateur que vous venez de créer de la façon suivante:

Changer le rôle 'simpleUser' en 'Administrator'
Changer le status de 'pending' en 'valid'

Vous êtes set
