import cv2
from ultralytics import YOLO

# Load YOLOv8 model (you can also use a custom model like 'yolov8n.pt', 'yolov8s.pt', etc.)
model = YOLO('yolov8n.pt')  # Use the Nano model for speed

# Start webcam
cap = cv2.VideoCapture(0)
#cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)   # or 640, 1280
#cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)  # or 480, 720

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Get frame width for zone division
    frame_width = frame.shape[1]
    left_zone = frame_width // 3
    right_zone = 2 * (frame_width // 3)

    # Run YOLOv8 inference
    results = model(frame, verbose=False)[0]

    left_detected = False
    right_detected = False

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        center_x = (x1 + x2) // 2

        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        if center_x < left_zone:
            left_detected = True
        elif center_x > right_zone:
            right_detected = True

    # Print direction logic
    if left_detected and right_detected:
        direction = "back"
    elif left_detected:
        direction = "right"
    elif right_detected:
        direction = "left"
    else:
        direction = "clear"

    print(direction)

    # Display direction on frame
    cv2.putText(frame, f"Direction: {direction}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # Show frame
    cv2.imshow("YOLOv8 Obstacle Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
