import io
import zipfile
import streamlit as st
import fitz  # pymupdf
import img2pdf
from PIL import Image

st.set_page_config(page_title="PDF ↔ JPG 변환기", page_icon="🔄", layout="centered")

st.title("🔄 PDF ↔ JPG 변환기")

tab1, tab2 = st.tabs(["📄 PDF → JPG", "🖼️ JPG → PDF"])

# ── PDF → JPG ────────────────────────────────────────────────────
with tab1:
    st.subheader("PDF를 JPG 이미지로 변환")

    uploaded_pdf = st.file_uploader("PDF 파일을 업로드하세요", type=["pdf"], key="pdf_up")

    dpi = st.slider("해상도 (DPI)", min_value=72, max_value=300, value=150, step=10,
                    help="높을수록 선명하지만 파일 크기가 커집니다.")

    if uploaded_pdf and st.button("JPG로 변환", type="primary", key="btn_pdf2jpg"):
        with st.spinner("변환 중..."):
            pdf_bytes = uploaded_pdf.read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            total = len(doc)

            jpg_buffers = []
            for i, page in enumerate(doc):
                mat = fitz.Matrix(dpi / 72, dpi / 72)
                pix = page.get_pixmap(matrix=mat)
                jpg_buf = io.BytesIO(pix.tobytes("jpeg"))
                jpg_buf.name = f"page_{i+1:03d}.jpg"
                jpg_buffers.append(jpg_buf)

            doc.close()

        st.success(f"변환 완료: {total}페이지")

        if total == 1:
            st.download_button(
                label="⬇️ JPG 다운로드",
                data=jpg_buffers[0].getvalue(),
                file_name="page_001.jpg",
                mime="image/jpeg",
            )
            st.image(jpg_buffers[0].getvalue(), caption="page_001.jpg")
        else:
            # 여러 페이지 → ZIP
            zip_buf = io.BytesIO()
            with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for buf in jpg_buffers:
                    zf.writestr(buf.name, buf.getvalue())
            zip_buf.seek(0)

            base_name = uploaded_pdf.name.rsplit(".", 1)[0]
            st.download_button(
                label=f"⬇️ ZIP 다운로드 ({total}장)",
                data=zip_buf,
                file_name=f"{base_name}_images.zip",
                mime="application/zip",
            )

            cols = st.columns(min(total, 4))
            for i, buf in enumerate(jpg_buffers):
                with cols[i % len(cols)]:
                    st.image(buf.getvalue(), caption=buf.name, use_container_width=True)

# ── JPG → PDF ────────────────────────────────────────────────────
with tab2:
    st.subheader("JPG 이미지를 PDF로 변환")

    uploaded_imgs = st.file_uploader(
        "JPG 파일을 업로드하세요 (여러 장 가능)",
        type=["jpg", "jpeg", "png"],
        accept_multiple_files=True,
        key="jpg_up",
    )

    if uploaded_imgs:
        order_labels = [f.name for f in uploaded_imgs]
        st.caption(f"업로드된 파일 순서 ({len(order_labels)}장): " + ", ".join(order_labels))

        output_name = st.text_input("저장할 PDF 파일명", value="output.pdf")
        if not output_name.endswith(".pdf"):
            output_name += ".pdf"

        if st.button("PDF로 변환", type="primary", key="btn_jpg2pdf"):
            with st.spinner("변환 중..."):
                img_bytes_list = []
                for f in uploaded_imgs:
                    img = Image.open(f)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG")
                    img_bytes_list.append(buf.getvalue())

                pdf_bytes = img2pdf.convert(img_bytes_list)

            st.success(f"변환 완료: {len(uploaded_imgs)}장 → {output_name}")
            st.download_button(
                label="⬇️ PDF 다운로드",
                data=pdf_bytes,
                file_name=output_name,
                mime="application/pdf",
            )
