
import os
import torch
from torchvision import models, transforms
from PIL import Image
import sys


folder_path = "./output"

files = os.listdir(folder_path)
for f in files:
    image_name = f

image_path = "./output/" + image_name

model = models.resnet18(pretrained=True)

model.fc = torch.nn.Linear(in_features=512, out_features=3)
loss_fn = torch.nn.CrossEntropyLoss()

model.load_state_dict(torch.load(
    "Inference/model/model.pt", map_location=torch.device('cpu')))

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)


classes = ['Healthy', 'Resistant', 'Susceptible']

test_transform = transforms.Compose([
    transforms.Resize(size=(224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])])


def classify(model, test_transform, image_path, classes):
    model.eval()
    image = Image.open(image_path)
    image = image.convert("RGB")
    image = test_transform(image).float()
    image = image.unsqueeze_(0)

    output = model(image.cpu())
    _, predicted = torch.max(output.data, 1)

    print(classes[predicted.item()])
    sys.stdout.flush()


classify(model, test_transform, image_path, classes)
