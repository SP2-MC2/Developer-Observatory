import redis
import config
from time import sleep
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, func, text, select, exc
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()
engine = create_engine(config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)

class CreatedInstances(Base):
    __tablename__ = "createdInstances"

    id = Column(Integer, primary_key=True)
    userid = Column(String)
    ip = Column(String)
    time = Column(DateTime, default=func.current_timestamp())
    ec2instance = Column(String)
    category = Column(Integer)
    condition = Column(Integer)
    instanceid = Column(String)
    finished = Column(Boolean)
    heartbeat = Column(DateTime, default=func.current_timestamp())
    instanceTerminated = Column(Boolean)

FILTER="""\
(heartbeat <= NOW() - '3 hours'::INTERVAL AND \
"instanceTerminated" is false) OR \
(finished is true AND "instanceTerminated" is false)"""

stmt = select(CreatedInstances).where(text(FILTER))

if __name__ == "__main__":
    # Setup redis
    redis = redis.Redis(host="redis", port=6379, db=0)

    print("Checking for old instances...")

    while True:
        try:
            with Session.begin() as session:
                result = session.execute(stmt)

                for instance in result.scalars().all():
                    print("Terminating", instance.ec2instance, instance.instanceid)
                    redis.rpush(config.REDIS_OLD_LIST, instance.instanceid)
                    instance.instanceTerminated = True
        except exc.DBAPIError as e:
            print("Got error:", e)

        sleep(config.OLD_CHECK_INTERVAL)
