from fastapi import Body, FastAPI, HTTPException, Response, Cookie
from pydantic import BaseModel
from typing import List, Tuple, Optional
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from typing import List
import os
from multiprocessing import Process, Manager


MAX_WORKERS = 10

# For Cross Origin Research Sharing issue
# https://fastapi.tiangolo.com/tutorial/cors/
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Do this to allow requests from our frontend, which is hosted on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chunk_cache = {}

def clearCache():
    chunk_cache.clear()

def loadChunk(startX: int, startZ: int, endX: int, endZ: int, minY: int, maxY: int, dim:str, cache=chunk_cache):
    world_file = "/mnt/c/Users/Tim/AppData/Roaming/.minecraft/saves/1_16_1"
    startx = startX
    startz = startZ
    endx = endX
    endz = endZ
    miny = minY
    maxy = maxY
    padding = 0
    direction = 'ne'
    key = "{}_{}_{}_{}_{}".format(startx, startz, minY, maxY,dim)
    
    if (key in cache):
        return cache[key]

    exit_code = os.system("./mcmap -from {} {} -to {} {} -min {} -max {} -{} -padding {} -dim {} {}  -file chunks/{}_{}_{}_{}_{}.png".format(startx, startz, endx, endz, miny, maxy, direction, padding, dim, world_file, startx, startz, minY, maxY, dim))

    if (exit_code != 0):
        cache[key] = FileResponse('./missing_chunk.png', media_type="image/png")
    else:
        cache[key] = FileResponse("./chunks/{}_{}_{}_{}_{}.png".format(startx, startz, minY, maxY, dim), media_type="image/png")
    return cache[key]

#coords: [[xstart,zstart,xend,zend], [xstart2,zstart2,xend2,zend2],...]
def loadChunksFromCoords(coords, cache, minY, maxY, dim):
    for coord in coords:
        loadChunk(coord[0], coord[1], coord[2], coord[3], minY, maxY, dim, cache)

@app.get('/data/chunk')
async def requestChunk(startX: int, startZ: int, endX: int, endZ: int, minY: int, maxY: int, dim: str):
    return loadChunk(startX, startZ, endX, endZ, minY, maxY, dim)

@app.post('/data/loadChunks')
async def loadChunks(coords : List[List[int]], minY:int, maxY:int, dim:str):
    manager = Manager()
    processes = []
    cache = manager.dict()

    for key in chunk_cache.keys():
        cache[key] = chunk_cache[key]


    NUM_PROCESSES = max(min(len(coords) // 2, MAX_WORKERS), 1)
    chunks_per_process = len(coords) // NUM_PROCESSES

    for i in range(NUM_PROCESSES):
        if i == NUM_PROCESSES - 1:
            chunks = coords[i*chunks_per_process:]
            p = Process(target=loadChunksFromCoords, args=(chunks, cache, minY, maxY, dim))
        else:
            chunks = coords[i*chunks_per_process:(i+1)*chunks_per_process]
            p = Process(target=loadChunksFromCoords, args=(chunks, cache, minY, maxY, dim))
        
        processes.append(p)
        p.start()

    for process in processes:
        process.join()

    for key in cache.keys():
        chunk_cache[key] = cache[key]

    return

@app.get('/data/reset')
async def reset():
    clearCache()
    code = os.system("rm -rf chunks/*.png")
    return code


@app.get('/')
def index():
    return FileResponse('../build/index.html')

app.mount("/", StaticFiles(directory="../build/"), name="static")

    
