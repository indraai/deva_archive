:splash:

key: **:key:**  
name: **:name:**  
ver: **:version:**  
author: **:author:**  
port: **:port:**  

:description:

---

## CONTENTS
- [STARTING](#starting)
- [DOCKER](#docker)
- [ME](#me)
- [DEVA](#deva)
- [VARIABLES](#variables)
- [LISTENERS](#listeners)
- [MODULES](#modules)
- [FUNCTIONS](#functions)
- [METHODS](#methods)
- [FILES](#files)

---

## Starting
### Node
```bash
$: npm start
```

---

### Docker
#### Build Docker Image

Go to the directory that has the Dockerfile and run the command to build the Docker image. The -t flag tags the image so it's easier to find later using the docker images command.

```bash
$: docker build -t <*app-tag*> .
```

#### Run Docker Image

```bash
$: docker run --name <app-name> -p <host_port1>:<app_port> -p <host_port2>:<socket_port> -dit <app-name>
```

The `<host_port1>` and `<host_port2> ` are optional and you can set which ever you like. As they will map to the main port (:port:) and socket port (:socket:).

- `<host_port1>` = API port (:port:)
- `<host_port2>` = Socket port (:socket:)

#### Print Output
Print the output of your app.

```bash
# Get container ID
$ docker ps

# Print output
$ docker logs <container-id>

# Example
Running on http://localhost::port:
```

#### Enter Container
To go inside the container you can use the exec command.

```bash
$ docker exec -it <container-id> /bin/bash
```

---
## ME
:me:

---

## DEVA
:deva:

---

## VARIABLES
:vars:

---

## LISTENERS
:listeners:

---

## MODULES
:modules:

---

## FUNCTIONS
:func:

---

## METHODS
:methods:

---

## FILES
Below are the files which build up the DEVA.

### CONFIG
:config:

### DATA
:data:

### CODE
:code:
