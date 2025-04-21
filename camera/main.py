from motor import Motor
from cam import getLaneCurve
import web as WebcamModule
import utlis
import cv2

# Initialize the trackbars window and sliders before processing
initialTrackBarVals = [102, 80, 20, 214]
utlis.initializeTrackbars(initialTrackBarVals)

# Initialize the motor with GPIO pins
motor = Motor(12, 17, 18, 13, 22, 23)

def main():
    # Capture an image from the camera
    img = WebcamModule.getImg()
    # Compute the lane curve value
    curveVal = getLaneCurve(img, display=2)

    # Steering sensitivity and limits
    sen = 1.3  # base sensitivity
    maxVal = 0.3  # maximum steering adjustment
    if curveVal > maxVal:
        curveVal = maxVal
    if curveVal < -maxVal:
        curveVal = -maxVal

    # Adjust sensitivity for small curves
    if curveVal > 0:
        sen = 1.7
        if curveVal < 0.05:
            curveVal = 0
    else:
        if curveVal > -0.08:
            curveVal = 0

    # Command the motor: (forward_speed, turning_rate, duration)
    motor.move(0.20, -curveVal * sen, 0.05)

    # Allow OpenCV to update windows and trackbars
    cv2.waitKey(1)

if __name__ == '__main__':
    # Continuous loop
    while True:
        main()
