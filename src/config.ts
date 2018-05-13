import commonEnv = require('common-env');
import dotenv = require('dotenv');

const env = commonEnv();

dotenv.config({ path: process.env.DOTENV_FILE });

export interface Config {
  application: {
    appStarted: boolean;
    ip: string;
    port: number;
    port_http: number;
    process_title: string;
    name: string;
    mode: string;
    version: string;
    ssl: {
      private_key: string;
      certificate: string;
      passphrase: string;
    };
    api: {
      basePath: string;
    };
    jwt: {
      secret: string;
      expiration_time: string;
    };
    log: {
      dir: string;
    };
    img: {
      dir: string;
    }
  };

  database: {
    mongoDB: {
      url: string;
      port: number;
      database_name: string;
      users_collection: string;
      salt_collection: string;
      db_migrations_collection: string;
    };
    migration: {
      version: string;
    };
  };

  roles: {
    administrator: string;
    simpleUser: string;
  };

  users: {
    default: {
      admin: {
        login: string;
        password: string;
      };
    };
    mail: {
      admin: {
        login: string,
        password: string
      };
    };
  };
}


export const defaultConfig: Config = {
  application: {
    appStarted: false,
    ip: '',
    port: 4177,
    port_http: 4187,
    process_title: '',
    name: '',
    mode: '',
    version: '',
    ssl: {
      private_key: '',
      certificate: '',
      passphrase: ''
    },
    api: {
      basePath: ''
    },
    jwt: {
      secret: '',
      expiration_time: '2h'
    },
    log: {
      dir: ''
    },
    img: {
      dir: ''
    }
  },
  database: {
    mongoDB: {
      url: '',
      port: 27017,
      database_name: '',
      users_collection: '',
      salt_collection: 'salt',
      db_migrations_collection: 'DB-Migrations'
    },
    migration: {
      version: '1.x'
    }
  },
  roles: {
    administrator: 'Administrator',
    simpleUser: 'SimpleUser'
  },
  users: {
    default: {
      admin: {
        login: 'hnouts@amiltone.fr',
        password: 'admin'
      }
    },
    mail: {
      admin: {
        login: 'hnouts@amiltone.fr',
        password: 'Amiltone1895*$'
      }
    }
  }
};

export const config: Config = env.getOrElseAll(defaultConfig);
