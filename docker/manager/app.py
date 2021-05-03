# Joe Lewis 2021
# 
# This software may be modified and distributed under the terms
# of the MIT license.  See the LICENSE file for details.
import docker, sys, redis
from time import sleep
import manager_config as config

INSTANCE_TAG = "devob-instance"
REDIS_QUEUE = "queuedInstances"
REDIS_BOOTING_COUNTER = "queuedInstancesBooting"
CHECK_INTERVAL = 5
POOL_SIZE = 1

def check_cwd():
    # TODO: Implement directory checks
    return True

def create_container(client, tag):
    """Run docker create to make a new instance and return the created
    container"""

    # Retrieve the network we're using from docker
    nets = client.networks.list(names=config.NETWORK_NAME)
    if len(nets) == 0:
        raise Exception("ERROR: Couldn't get docker network to attach instance"
                        "to, are the main containers started?")
    
    net = nets[0]

    return client.containers.run(tag, detach=True, auto_remove=True, network=net.name)


def dint(s):
    if type(s) == int:
        return s
    elif type(s) == bytes:
        return int(s.decode())
    elif type(s) == str:
        return int(s)
    else:
        raise Exception(f"Could not handle type {type(s)}")


if __name__ == "__main__":
    if not check_cwd():
        print("Looks like the script isn't running in the correct directory, "
                "please run from the root directory of developer observatory")

    print("Developer Observatory Docker Management Script")
    print("Starting...")

    # Setup docker
    client = docker.from_env()
    
    print("Building most recent version of instance server")
    instance_image, logs = client.images.build(path="./instance/", rm=True,
                                                tag=config.INSTANCE_TAG)
    print(f"Finished building {config.INSTANCE_TAG}")


    # Setup redis
    r = redis.Redis(host="localhost", port=6379, db=0)



    while(True):
        # Ensure booting counter is not negative
        booting = r.get(config.REDIS_BOOTING_COUNTER)
        if booting == None or dint(booting) < 0:
            r.set(config.REDIS_BOOTING_COUNTER, 0)

        if dint(r.llen(config.REDIS_QUEUE)) + \
                dint(r.get(config.REDIS_BOOTING_COUNTER)) <= config.POOL_SIZE:
            try:
                r.incr(config.REDIS_BOOTING_COUNTER)

                # Create docker container
                c = create_container(client, config.INSTANCE_TAG)

                r.rpush(config.REDIS_QUEUE, f"{c.name}|||{c.id[:12]}")
                print(f"Started new container: {c.name}")

            except Exception as e:
                print(e)
                sys.exit(1)

            r.decr(config.REDIS_BOOTING_COUNTER)

        sleep(config.CHECK_INTERVAL)

