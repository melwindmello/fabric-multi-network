## Build Your First Multi Network (BYMN)

For documentation , follow this link [Hyperledger Fabric on Multiple Hosts using Docker Swarm and Compose](https://medium.com/@malliksarvepalli/hyperledger-fabric-on-multiple-hosts-using-docker-swarm-and-compose-f4b70c64fa7d)


Tried the setup from branch 1.2 with following VMs:
Orderer on GCP
Org1 on GCP
Org2 on DigitalOcean
Result: SetupNetwork works perfectly fine!

However, when trying with Org2 on Azure, there is an issue with the Orderer not able to send the initial block to the CLI running on Azure (Org2). To be investigated. TODO - for late.
