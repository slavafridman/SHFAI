package bzq.shf.batch.utils;



import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;
/**
 * Writing the error messages to error file.
 * Creation date: (05/12/2002 17:46:19)
 * @author: Slava Fridman
 */
public class OutFileWriter {
	FileWriter fileOutStream;
    BufferedWriter dataOutStream;
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 10:30:09)
 * @param openFile java.lang.String
 */
public OutFileWriter(String openFile) throws IOException{
	 this.open(openFile);
	}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 10:30:09)
 * @param openFile java.lang.String
 */
public OutFileWriter(String openFile,boolean statusAppend) throws IOException{
	 this.open(openFile,statusAppend);
	}
/**
 * Close the buffered writer and file out stream.
 * Creation date: (05/12/2002 17:48:39)
 */
public void close() throws IOException
{
    dataOutStream.close();
    fileOutStream.close();

}
/**
 * Flashing buffer to error log file.
 * Creation date: (25/12/2002 10:27:06)
 */
public void flush() throws IOException
{
     //Writing data from buffer to file
    dataOutStream.flush();
}
/**
 * *******For test only!!!!!********
 * Creation date: (25/12/2002 15:50:48)
 * @return java.lang.String
 * @param date java.util.Date
 */
public String getCurrentDate(boolean file)
{
    Calendar cal = new GregorianCalendar(TimeZone.getDefault());
    String day = Integer.toString(cal.get(Calendar.DAY_OF_MONTH));
    String month = Integer.toString(cal.get(Calendar.MONTH));
    String year = Integer.toString(cal.get(Calendar.YEAR));
    String hours = Integer.toString(cal.get(Calendar.HOUR_OF_DAY));
    String minutes = Integer.toString(cal.get(Calendar.MINUTE));
    String seconds = Integer.toString(cal.get(Calendar.SECOND));

    if (day.length() == 1)
        {
        day = "0" + day;
    }
    if (month.length() == 1)
        {
        month = "0" + month;
    }
    if (hours.length() == 1)
        {
        hours = "0" + hours;
    }
    if (minutes.length() == 1)
        {
        minutes = "0" + minutes;
    }
    if (seconds.length() == 1)
        {
        seconds = "0" + seconds;
    }
    year = year.substring(2);
    if (file)
        {
        return day + month + year;
    }
    else
        {
        return day
            + "/"
            + month
            + "/"
            + year
            + " "
            + hours
            + ":"
            + minutes
            + ":"
            + seconds;
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
    } catch (IOException e) {
	    
    }
 }
/**
 * Open file and create output buffer for writing.
 * Creation date: (25/12/2002 11:11:41)
 */
public void open(String fileName,boolean statusAppend)
{
    try {
    //open the error log file for input
    fileOutStream = new FileWriter(fileName, statusAppend);
    dataOutStream = new BufferedWriter(fileOutStream);
    //*If file not exist a new file will created automatic
    } catch (IOException e) {
	    
    }
 }
/**
 * Writing the error message into out stream buffer.
 * Creation date: (05/12/2002 17:44:41)
 * @param line java.lang.String
 */
public void write(String line)   {
	//add an entry to error log
	try {
	dataOutStream.write(line);
	dataOutStream.newLine();
	} catch (IOException e) {
		
	}
}
}
