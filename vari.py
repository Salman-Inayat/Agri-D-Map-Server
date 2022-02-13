import numpy as np
import cv2
import matplotlib.pyplot as plt
import sys


def vari(file):
    size = len(file)
    file_name = file[:size - 3]
    output_path = "./output/" + file_name + "png"
    img = cv2.imread("./vari/input/" + file)

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    b, g, r = cv2.split(img)

    vari = (g - r) / (g + r - b)

    plt.imsave(output_path, vari, cmap='RdYlGn_r', vmin=0, vmax=1)


vari(sys.argv[1])
