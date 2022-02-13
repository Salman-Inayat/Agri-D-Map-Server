import numpy as np
from PIL import Image as Img
import cv2
import os
from tensorflow.keras.preprocessing.image import load_img
from tensorflow.keras.preprocessing.image import img_to_array

os.chdir("./u2net")

#import u2net_test.py


# Testing on CPU by disabling GPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

def background_removal():
    os.system("python -W ignore u2net_test.py")
    #!python -W ignore u2net_test.py
   
    image_dir = os.path.join(os.getcwd(), 'images')
    names = [name[:-4] for name in os.listdir(image_dir)]
    THRESHOLD = 0.9
    RESCALE = 255
    LAYER = 2
    COLOR = (0, 0, 0)
    THICKNESS = 4
    SAL_SHIFT = 100


    for name in names:

      # BACKGROUND REMOVAL

      output = load_img('./results/'+name+'.png')
      out_img = img_to_array(output)
      out_img /= RESCALE

      out_img[out_img > THRESHOLD] = 1
      out_img[out_img <= THRESHOLD] = 0

      shape = out_img.shape
      a_layer_init = np.ones(shape = (shape[0],shape[1],1))
      mul_layer = np.expand_dims(out_img[:,:,0],axis=2)
      a_layer = mul_layer*a_layer_init
      rgba_out = np.append(out_img,a_layer,axis=2)

      input = load_img('./images/'+name+'.jpg')
      inp_img = img_to_array(input)
      inp_img /= RESCALE

      a_layer = np.ones(shape = (shape[0],shape[1],1))
      rgba_inp = np.append(inp_img,a_layer,axis=2)

      rem_back = (rgba_inp*rgba_out)
      rem_back_scaled = rem_back*RESCALE

      # BOUNDING BOX CREATION

      out_layer = out_img[:,:,LAYER]
      x_starts = [np.where(out_layer[i]==1)[0][0] if len(np.where(out_layer[i]==1)[0])!=0 else out_layer.shape[0]+1 for i in range(out_layer.shape[0])]
      x_ends = [np.where(out_layer[i]==1)[0][-1] if len(np.where(out_layer[i]==1)[0])!=0 else 0 for i in range(out_layer.shape[0])]
      y_starts = [np.where(out_layer.T[i]==1)[0][0] if len(np.where(out_layer.T[i]==1)[0])!=0 else out_layer.T.shape[0]+1 for i in range(out_layer.T.shape[0])]
      y_ends = [np.where(out_layer.T[i]==1)[0][-1] if len(np.where(out_layer.T[i]==1)[0])!=0 else 0 for i in range(out_layer.T.shape[0])]

      startx = min(x_starts)
      endx = max(x_ends)
      starty = min(y_starts)
      endy = max(y_ends)
      start = (startx,starty)
      end = (endx,endy)

      box_img = inp_img.copy()
      box_img = cv2.rectangle(box_img, start, end, COLOR, THICKNESS)
      box_img = np.append(box_img,a_layer,axis=2)
      box_img_scaled = box_img*RESCALE

      # SALIENT FEATURE MAP

      sal_img = inp_img.copy()
      add_layer = out_img.copy()
      add_layer[add_layer==1] = SAL_SHIFT/RESCALE
      sal_img[:,:,LAYER] += add_layer[:,:,LAYER]
      sal_img = np.append(sal_img,a_layer,axis=2)
      sal_img_scaled = sal_img*RESCALE
      sal_img_scaled[sal_img_scaled>RESCALE] = RESCALE

      # OUTPUT RESULTS

      inp_img*=RESCALE
      inp_img = np.append(inp_img,RESCALE*a_layer,axis=2)
      inp_img = cv2.resize(inp_img,(int(shape[1]/3),int(shape[0]/3)))
      rem_back = cv2.resize(rem_back_scaled,(int(shape[1]/3),int(shape[0]/3)))
      rem_save = Img.fromarray(rem_back.astype('uint8'), 'RGBA')
      rem_save.save("../output/" + name + ".png")
    #   box_img = cv2.resize(box_img_scaled,(int(shape[1]/3),int(shape[0]/3)))
    #   sal_img = cv2.resize(sal_img_scaled,(int(shape[1]/3),int(shape[0]/3)))
    #   result = np.concatenate((inp_img,rem_back,box_img,sal_img),axis=1)
    #   result_img = Img.fromarray(result.astype('uint8'), 'RGBA')
    #   print('\nINPUT                                    BACKGROUND REMOVED                     BOUNDING BOX                               SALIENT MAP\n')
    #   display(result_img)

background_removal()
