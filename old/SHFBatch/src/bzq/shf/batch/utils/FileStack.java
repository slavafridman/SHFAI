package bzq.shf.batch.utils;

import java.util.Vector;

/**
 * Insert the type's description here.
 * Creation date: (17/12/2003 12:21:48)
 * @author: Eduard Katcherovski
 */
public class FileStack {
    Vector files = null;
    BatchFileReader reader = null;
    OutFileWriter outFile = null;
    String filePath;

/**
 * Insert the method's description here.
 * Creation date: (17/12/2003 12:46:03)
 * @param pathandfile java.lang.String
 */
public FileStack(String pathandfile) throws Exception {
    super();
    String fname;
    filePath = pathandfile;
    files = new Vector();

    BatchFileReader reader = new BatchFileReader(pathandfile);
    reader.open(pathandfile);
    while ((fname = reader.getRow()) != null) {
        files.add(fname);
    }
    reader.close();
}
    /**
     * Insert the method's description here.
     * Creation date: (17/12/2003 12:57:14)
     * @return java.lang.String
     */
    public String getFileFromStack() {
        if (files != null && files.size() > 0) {
            return (String) files.get(0);
        } else {
            return null;
        }
    }
/**
 * Insert the method's description here.
 * Creation date: (17/12/2003 13:51:08)
 * @return java.lang.String
 */
public java.lang.String getFilePath() {
	return filePath;
}
/**
 * Insert the method's description here.
 * Creation date: (17/12/2003 12:23:49)
 * @param args java.lang.String[]
 */
public static void main(String[] args) {
    try {
        FileStack fileStack = new FileStack("c:\\mdr\\test.stack");
        System.out.println(fileStack.getFileFromStack());
        fileStack.refreshFileStack();
    } catch (Exception ioex) {
        ioex.printStackTrace();
    }
}
    /**
     * Insert the method's description here.
     * Creation date: (17/12/2003 13:08:46)
     */
    public void refreshFileStack() throws Exception {

        outFile = new OutFileWriter(filePath,false);
        if (files != null & files.size() > 1) {
            for (int i = 1; i < files.size(); i++) {
                outFile.write((String) files.get(i));
            }
        } else
            if (files != null & files.size() == 1) {
               // write nothing to file
            } else {
                throw new Exception("FileStack is empty");
            }
        outFile.flush();
        outFile.close();

    }
}
