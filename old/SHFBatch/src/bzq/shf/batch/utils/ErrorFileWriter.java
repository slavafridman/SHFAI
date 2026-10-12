package bzq.shf.batch.utils;


import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
/**
 * Writing the error messages to error file.
 * Creation date: (05/12/2002 17:46:19)
 * @author: Slava Fridman
 */
public class ErrorFileWriter extends OutFileWriter
{
	private boolean bufEmpty; 
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 10:50:25)
 * @param errorFile java.lang.String
 */
public ErrorFileWriter(String errorFile) throws IOException {
	super(errorFile);
	bufEmpty = true;
	}
/**
 * Close the buffered writer and file out stream.
 * Creation date: (05/12/2002 17:48:39)
 */
public void close() throws IOException
{
    write(
        "Stop errors recording - "
            + getCurrentDate(false));

    dataOutStream.close();
    fileOutStream.close();

}
/**
 * Flashing buffer to error log file.
 * Creation date: (25/12/2002 10:27:06)
 */
public void flush() throws IOException
{
    //Creating delimiter for different records   
    write("-------");
    bufEmpty = true;
    //Writing data from buffer to file   
    dataOutStream.flush();
    
}
/**
 * Insert the method's description here.
 * Creation date: (25/05/2003 15:06:22)
 * @return boolean
 */
public boolean isBufEmpty() {
	return bufEmpty;
}
/**
 * Main method for test only.
 * Creation date: (25/12/2002 10:41:16)
 * @param args java.lang.String[]
 */
public static void main(String[] args)
{


    try
        {
   	    ErrorFileWriter errorFile = new ErrorFileWriter("c:\\Mdr\\error.log");	        
	//	Calendar cal=Calendar.getInstance();
    //    errorFile.open("C:\\errors112545"+errorFile.getCurrentDate(true)+".log");
        //Create error messages for 5 records
        
        for (int i = 0; i < 10; i++)
            {
            errorFile.write("Start error file writing.");
            errorFile.write("The error if exist.");
            errorFile.write("End of file writing");
            errorFile.flush();
        }
        errorFile.close();
    }
    catch (IOException ioex)
        {
        ioex.printStackTrace();
        System.exit(100);
    }
}
/**
 * Open file and create output buffer for writing.
 * Creation date: (25/12/2002 11:11:41)
 */
public void open(String fileName)
{
     
    try {
    //open the error log file for input
    fileOutStream = new FileWriter(fileName, true);
    dataOutStream = new BufferedWriter(fileOutStream);
    //*If file not exist a new file will created automatic
    write(
        "Start errors recording - "
            + getCurrentDate(false));
    write("");
    } catch (IOException e) {
	    
    }
}
/**
 * Insert the method's description here.
 * Creation date: (25/05/2003 15:06:22)
 * @param newBufEmpty boolean
 */
public void setBufEmpty(boolean newBufEmpty) {
	bufEmpty = newBufEmpty;
}
/**
 * Insert the method's description here.
 * Creation date: (25/05/2003 15:11:27)
 */
public void write(String msg) {
	bufEmpty = false;
	super.write(msg);
	}
}
