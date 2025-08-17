# Backend removed
"""
This project now runs frontend-only (static HTML/CSS/JS).
The previous FastAPI app has been decommissioned intentionally.

This file is intentionally left minimal to avoid accidental backend usage.
"""

if __name__ == "__main__":
    print("Backend is removed. No server to run.")



# Dev stub switch (disabled by default). Enable only for dev by setting ALLOW_STUB=1 in env.
"""
ALLOW_STUB = os.environ.get('ALLOW_STUB', '0') == '1'

# Defaults; may be overwritten when a real model is loaded
LABELS: List[str] = ['classA', 'classB', 'classC']
INPUT_SIZE: Tuple[int, int] = (224, 224)  # (H, W)

# Model loading globals
MODELS_DIR = (Path(__file__).resolve().parent.parent / 'models')
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH_ENV = os.environ.get('MODEL_PATH', '').strip()
MODEL_INPUT_ENV = os.environ.get('MODEL_INPUT_SIZE', '').strip()  # e.g., "224,224"
MODEL_LABELS_ENV = os.environ.get('MODEL_LABELS', '').strip()     # comma separated labels
MODEL_KIND: Optional[str] = None  # 'onnx' | 'torch' | 'tf'
MODEL_OBJ = None

def _parse_input_hw(val: str) -> Tuple[int, int]:
    try:
        a, b = [int(x) for x in val.split(',')]
        if a > 0 and b > 0:
            return (a, b)
    except Exception:
        pass
    return INPUT_SIZE

def _load_labels() -> List[str]:
    if MODEL_LABELS_ENV:
        return [x.strip() for x in MODEL_LABELS_ENV.split(',') if x.strip()]
    lbl_file = MODELS_DIR / 'labels.txt'
    if lbl_file.exists():
        try:
            return [line.strip() for line in lbl_file.read_text(encoding='utf-8').splitlines() if line.strip()]
        except Exception:
            pass
    return LABELS

def _find_model_path() -> Optional[Path]:
    if MODEL_PATH_ENV:
        p = Path(MODEL_PATH_ENV)
        if p.exists():
            return p
    for c in [
        MODELS_DIR / 'model.onnx',
        MODELS_DIR / 'your_model.onnx',
        MODELS_DIR / 'best.onnx',
        MODELS_DIR / 'model.pt',
        MODELS_DIR / 'best.pt',
        MODELS_DIR / 'model.pth',
        MODELS_DIR / 'model.h5',
        MODELS_DIR / 'saved_model',
    ]:
        if c.exists():
            return c
    for c in MODELS_DIR.glob('*'):
        return c
    return None

def _softmax_np(x: np.ndarray) -> np.ndarray:
    x = x.astype(np.float32)
    x = x - np.max(x)
    e = np.exp(x)
    return e / np.sum(e)

def _preprocess(img: Image.Image, size: Tuple[int, int]) -> np.ndarray:
    H, W = size[0], size[1]
    arr = np.array(img.convert('RGB').resize((W, H), Image.BILINEAR)).astype('float32') / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    chw = arr.transpose(2, 0, 1)  # CHW
    return chw

def try_load_model():
    global MODEL_KIND, MODEL_OBJ, INPUT_SIZE, LABELS
    LABELS = _load_labels() or LABELS
    if MODEL_INPUT_ENV:
        INPUT_SIZE = _parse_input_hw(MODEL_INPUT_ENV)
    p = _find_model_path()
    if not p:
        print('[ML] No model found in', MODELS_DIR)
        return
    try:
        if p.suffix.lower() == '.onnx':
            import onnxruntime as ort  # type: ignore
            sess = ort.InferenceSession(str(p), providers=['CPUExecutionProvider'])
            MODEL_KIND, MODEL_OBJ = 'onnx', sess
            try:
                ishape = sess.get_inputs()[0].shape
                if len(ishape) == 4:
                    if ishape[1] == 3 and isinstance(ishape[2], int) and isinstance(ishape[3], int):
                        INPUT_SIZE = (ishape[2], ishape[3])
                    elif ishape[3] == 3 and isinstance(ishape[1], int) and isinstance(ishape[2], int):
                        INPUT_SIZE = (ishape[1], ishape[2])
            except Exception:
                pass
            print('[ML] ONNX model loaded:', p)
            return
        if p.suffix.lower() in {'.pt', '.pth'}:
            import torch  # type: ignore
            model = torch.jit.load(str(p), map_location='cpu').eval()
            MODEL_KIND, MODEL_OBJ = 'torch', model
            print('[ML] TorchScript model loaded:', p)
            return
        if p.suffix.lower() == '.h5' or p.is_dir():
            import tensorflow as tf  # type: ignore
            model = tf.keras.models.load_model(str(p))
            MODEL_KIND, MODEL_OBJ = 'tf', model
            print('[ML] TensorFlow model loaded:', p)
            return
    except ModuleNotFoundError as e:
        print('[ML] Required runtime not installed for', p, '->', e)
    except Exception as e:
        print('[ML] Failed to load model', p, '->', e)

def infer_with_loaded(img: Image.Image) -> tuple[str, float, dict]:
    if MODEL_KIND is None or MODEL_OBJ is None:
        raise RuntimeError('Model not loaded')
    chw = _preprocess(img, INPUT_SIZE)
    if MODEL_KIND == 'onnx':
        import onnxruntime as ort  # type: ignore
        sess: 'ort.InferenceSession' = MODEL_OBJ  # type: ignore
        inp = sess.get_inputs()[0]
        name = inp.name
        # Choose NCHW vs NHWC by input shape
        if len(inp.shape) == 4 and inp.shape[1] == 3:
            data = chw[None, ...].astype('float32')
        else:
            nhwc = chw.transpose(1, 2, 0)[None, ...].astype('float32')
            data = nhwc
        out = sess.run(None, {name: data})[0][0]
        probs = _softmax_np(np.array(out))
        idx = int(np.argmax(probs))
        label = LABELS[idx] if 0 <= idx < len(LABELS) else f'class_{idx}'
        return label, float(probs[idx]), {'probs': probs.tolist()}
    if MODEL_KIND == 'torch':
        import torch  # type: ignore
        x = torch.from_numpy(chw[None, ...]).float()
        with torch.no_grad():
            logits = MODEL_OBJ(x).detach().cpu().numpy()[0]
        probs = _softmax_np(np.array(logits))
        idx = int(np.argmax(probs))
        label = LABELS[idx] if 0 <= idx < len(LABELS) else f'class_{idx}'
        return label, float(probs[idx]), {'probs': probs.tolist()}
    if MODEL_KIND == 'tf':
        import tensorflow as tf  # type: ignore
        nhwc = chw.transpose(1, 2, 0)[None, ...].astype('float32')
        logits = MODEL_OBJ.predict(nhwc)[0]
        probs = _softmax_np(np.array(logits))
        idx = int(np.argmax(probs))
        label = LABELS[idx] if 0 <= idx < len(LABELS) else f'class_{idx}'
        return label, float(probs[idx]), {'probs': probs.tolist()}
    raise RuntimeError('Unsupported model kind')

def infer_stub(img: Image.Image):
    w, h = img.size
    g = np.mean(np.array(img.convert('L'))) / 255.0
    idx = int(round(g * (len(LABELS) - 1)))
    conf = 0.75 + 0.2 * (g - 0.5)
    return LABELS[idx], float(max(0.01, min(conf, 0.99))), {'width': w, 'height': h, 'grayMean': g}

# ==== FastAPI setup ====
app = FastAPI(title='MediConnect ML API', version='1.0.0')

# Allow local dev from browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # tighten in prod
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/health')
def health():
    return {
        'status': 'ok',
        'model_kind': MODEL_KIND,
        'input_size': INPUT_SIZE,
        'labels': LABELS[:5] + (['...'] if len(LABELS) > 5 else []),
    }

class AnalyzeResponse(BaseModel):
    riskLevel: str
    probableCauses: list[str]
    precautions: list[str]
    homeRemedies: list[str]
    recommendedSpecialist: str
    urgency: str
    imageAnalysis: dict | None = None

# Map model output to your site schema

def to_site_schema(label: str, confidence: float, details: dict) -> AnalyzeResponse:
    # Minimal mapping demo; customize as needed per your model
    risk = 'low'
    urgency = 'routine'
    specialist = 'general'
    causes = [f'Finding: {label}']
    if confidence > 0.85:
        risk = 'moderate'
        urgency = 'within_week'
    if 'melanoma' in label.lower():
        risk = 'high'
        urgency = 'immediate'
        specialist = 'dermatology'
        causes.append('Suspicious skin lesion detected by model')

    return AnalyzeResponse(
        riskLevel=risk,
        probableCauses=causes,
        precautions=[
            'This is an AI assistive result, not a diagnosis',
            'Consult a qualified clinician for confirmation',
            'Monitor for changes and worsening'
        ],
        homeRemedies=[
            'Keep the area clean and dry',
            'Avoid harsh products until evaluated',
            'Use sunscreen if lesion is exposed to sun'
        ],
        recommendedSpecialist=specialist,
        urgency=urgency,
        imageAnalysis={
            'label': label,
            'confidence': confidence,
            'details': details,
        }
    )

@app.post('/analyze', response_model=AnalyzeResponse)
async def analyze(symptoms: str = Form(''), image: UploadFile = File(None)):
    # Require an image for ML analysis
    if image is None:
        raise HTTPException(status_code=400, detail='Image is required for ML analysis.')

    # Read and convert image
    try:
        raw = await image.read()
        img = Image.open(io.BytesIO(raw)).convert('RGB')
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid image file.')

    # Use real model if loaded; else only allow dev stub when explicitly enabled
    if MODEL_OBJ is not None and MODEL_KIND is not None:
        try:
            label, conf, details = infer_with_loaded(img)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f'Model inference failed: {e}')
    elif ALLOW_STUB:
        label, conf, details = infer_stub(img)
    else:
        raise HTTPException(status_code=503, detail='ML model not loaded. Place your model in the models folder (e.g., model.onnx/model.pt) and optional labels.txt. You can also set MODEL_PATH env. For dev only, set ALLOW_STUB=1 to enable stub.')

    result = to_site_schema(label, conf, details)
    return result

if __name__ == '__main__':
    import uvicorn
    try_load_model()
    uvicorn.run('app:app', host='0.0.0.0', port=5000, reload=True)
"""
