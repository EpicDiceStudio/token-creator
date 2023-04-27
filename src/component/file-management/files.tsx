import { FileUploader } from "react-drag-drop-files";
import "./files.scss";
import fileTypes from "../../utils/filetype/filetype";

export const Files = (props: any) => {
  const file: any = props.file;
  const setFile: any = props.setFile;

  function handleChange(file: any): void {
    setFile(file);
  }
  return (
    <section className={"FileSection"}>
      <FileUploader
        multiple={false}
        handleChange={handleChange}
        name={"file"}
        types={fileTypes}
        children={
          <div className={"dragAndDropArea"}>
            <p>Drag or drop you're file</p>
            <p>File must have JPEG,PNG,GIF,PNG,MP4,AVI,WEBM,AVIF extension</p>
          </div>
        }
      />
    </section>
  );
};
