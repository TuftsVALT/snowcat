#!/usr/bin/env python3
from subprocess import check_output


pod_names = check_output(["kubectl", "get", "pods"]).decode("utf-8")
pod_names = pod_names.splitlines()
pod_names = [line.split()[0] for line in pod_names[1:]]

#kubectl get pods -o=custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,PORT:.spec.containers[*].ports[*].hostPort
#no way to add node ips to list at the moment

for pod_name in pod_names:
  if pod_name.startswith('tufts-'):
    output = check_output(["kubectl", "describe", "pods", pod_name]).decode("utf-8")
    output = output.splitlines()
    output = [line.strip() for line in output]
    nodeIp = [line for line in output if line.startswith("Node:")][0].split()[1].split('/')[1]
    port = [line for line in output if line.startswith("Host Port:")][0].split()[2].split('/')[0]
    print(pod_name + ' - ' + nodeIp + ' - ' +  port)
