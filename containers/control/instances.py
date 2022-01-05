import logging
import config
from sqlalchemy import text, select
from model import CreatedInstances

log = logging.getLogger(__name__)

FILTER = """\
(heartbeat <= NOW() - '3 hours'::INTERVAL AND \
"instanceTerminated" is false) OR \
(finished is true AND "instanceTerminated" is false)"""


def check_old_instances(session_builder, redis):
    stmt = select(CreatedInstances).where(text(FILTER))
    with session_builder.begin() as session:
        result = session.execute(stmt)

        for instance in result.scalars().all():
            log.info("Terminating %s %s",
                     instance.ec2instance,
                     instance.instanceid)
            redis.rpush(config.REDIS_OLD_LIST, instance.instanceid)
            instance.instanceTerminated = True
