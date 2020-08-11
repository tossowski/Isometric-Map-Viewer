from fastapi import Body, FastAPI, HTTPException, Response, Cookie
from pydantic import BaseModel
from typing import List, Tuple, Optional
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os


# For Cross Origin Research Sharing issue
# https://fastapi.tiangolo.com/tutorial/cors/
from fastapi.middleware.cors import CORSMiddleware

# origins = [
#     "http://localhost:3000"
# ]

app = FastAPI()

# Do this to allow requests from our frontend, which is hosted on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chunk_cache = set()


@app.get('/data/chunk')
async def requestChunk(startX: int, startZ: int, endX: int, endZ: int):
    world_file = "/mnt/c/Users/Tim/AppData/Roaming/.minecraft/saves/1_16_1"
    startx = startX
    startz = startZ
    endx = endX
    endz = endZ
    miny = 0
    maxy = 255
    padding = 0
    direction = 'ne'

    if ("{}_{}_{}_{}".format(startx, startz, endx, endz) in chunk_cache):
        return FileResponse("./chunks/{}_{}_{}_{}.png".format(startx, startz, endx, endz), media_type="image/png")

    os.system("/mnt/c/Users/Tim/Desktop/Code/mcmap/mcmap -from {} {} -to {} {} -min {} -max {} -{} -padding {} {}  -file chunks/{}_{}_{}_{}.png".format(startx, startz, endx, endz, miny, maxy, direction, padding, world_file, startx, startz, endx, endz))
    chunk_cache.add("{}_{}_{}_{}".format(startx, startz, endx, endz))
    return FileResponse("./chunks/{}_{}_{}_{}.png".format(startx, startz, endx, endz), media_type="image/png")
    #return "./{}_{}_{}_{}.png".format(startx, startz, endx, endz)
