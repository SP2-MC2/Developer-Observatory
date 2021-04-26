# Joe Lewis 2021
# 
# This software may be modified and distributed under the terms
# of the MIT license.  See the LICENSE file for details.
import docker, sys

INSTANCE_TAG = "devob-instance"

def check_cwd():
    # TODO: Implement directory checks
    return True

def create_container(client, tag):
    """Run docker create to make a new instance and return the created
    container"""

    # Retrieve the network we're using from docker
    nets = client.networks.list(names="devob-instances")
    if len(nets) == 0:
        print("ERROR: Couldn't get docker network to attach instance to, are the main containers started?")
        return None
    
    net = nets[0]
    print(net.name)

    return client.containers.run(tag, detach=True, auto_remove=True, network=net.name)




if __name__ == "__main__":
    if not check_cwd():
        print("Looks like the script isn't running in the correct directory, "
                "please run from the root directory of developer observatory")

    print("Developer Observatory Docker Management Script")
    print("Starting...")

    # Setup docker
    client = docker.from_env()
    
    print("Building most recent version of instance server")
    instance_image, logs = client.images.build(path="./instance/", rm=True, tag=INSTANCE_TAG)
    print(f"Finished building {INSTANCE_TAG}")

    cont = create_container(client, INSTANCE_TAG)
    if cont == None:
        print("Error while creating container, stopping program.")
        sys.exit(1)
    
    print(f"Started new container: {cont.name}")
