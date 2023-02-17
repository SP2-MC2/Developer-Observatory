import psycopg2
import sys
import json
from typing import List
from pathlib import Path


DSN="dbname=notebook user=created_instances_user"
TABLE_NAME = "createdInstances"

def get_columns(c: psycopg2.extensions.connection, table_name: str) -> List[str]:
    STMT = "SELECT column_name FROM information_schema.columns WHERE table_name = %s"
    cur = c.cursor()
    cur.execute(STMT, (table_name,))
    return [x[0] for x in cur.fetchall()]

def get_userids(c: psycopg2.extensions.connection) -> List[str]:
    """Gets a list of the user ids currently in the createdInstances table"""
    STMT = "SELECT userid FROM \"createdInstances\""
    cur = c.cursor()
    cur.execute(STMT)
    return [x[0] for x in cur.fetchall()]

def create_ignored(c: psycopg2.extensions.connection) -> None:
    """Creates a new boolean column called ignored into createdInstances"""
    # ALTER TABLE createdInstances ADD COLUMN ignored boolean DEFAULT false
    STMT = "ALTER TABLE \"createdInstances\" ADD COLUMN ignored boolean DEFAULT false"
    cur = c.cursor()
    cur.execute(STMT)
    c.commit()
    cur.close()

def get_password() -> str:
    # TODO: open .secrets and read pwUser1
    secrets_file = Path("config/.secrets")
    if not secrets_file.exists():
        print("Secrets file not found, cannot connect to database")
        sys.exit(-1)

    f = open(secrets_file)
    secrets = f.readlines()
    f.close()
    for l in secrets:
        if l.startswith("pwUser1"):
            return l.split("=")[1].strip("\n")

    print("Could not find correct password in secrets file")
    sys.exit(-1)

def add_ignored(c: psycopg2.extensions.connection, ignored_ids: List[str]) -> None:
    STMT = "UPDATE \"createdInstances\" SET ignored = true WHERE userid = %s"

    db_userids = get_userids(c)
    cur = c.cursor()
    for uid in ignored_ids:
        if uid not in db_userids:
            print(f"User ID {uid} not in database, skipping")
        else:
            cur.execute(STMT, (uid,))

    c.commit()
    cur.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <settings.json> <db ip>")
        sys.exit(-1)

    settings_path = Path(sys.argv[1])
    ip = sys.argv[2]
        

    c = psycopg2.connect(DSN + f" password={get_password()}" + f" host={ip}")
    print("Connected to", c.info.host)

    instances_columns = get_columns(c, TABLE_NAME)
    if "ignored" not in instances_columns:
        print("Creating ignored column in database")
        create_ignored(c)

    f = open(settings_path)
    ignored_ids = json.load(f)["ignored"]
    f.close()
    add_ignored(c, ignored_ids)
    
    print("Finished")
