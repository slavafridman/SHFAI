package bzq.shf.batch.utils;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
/**
 * Read rows from external input file utility.
 * Creation date: (05/12/2002 17:47:14)
 * @author: Slava Fridman
 */
public class BatchFileReader
{
	private FileReader fileInStream;
	private BufferedReader dataInStream;
    
	//Number of current readed line	
	private int currentRowNumber = 0;
/**
 * Insert the method's description here.
 * Creation date: (28/04/2003 11:41:15)
 * @param inFile java.lang.String
 */
public BatchFileReader(String inFile) throws IOException {
		 this.open(inFile);	
	}
/**
 * Closing input buffer and file.
 * Creation date: (29/12/2002 16:00:02)
 * @exception java.io.IOException The exception description.
 */
public void close() throws java.io.IOException
{
	fileInStream.close();
	dataInStream.close();
}
/**
 * Getting number of current record.
 * Creation date: (29/12/2002 15:47:47)
 * @return int
 */
public int getCurrentRowNumber()
{
	return currentRowNumber;
}
/**
 * Getting the current record from file
 * Creation date: (29/12/2002 15:46:16)
 * @return java.lang.String
 * @exception java.io.IOException The exception description.
 */
public String getRow() throws java.io.IOException
{
	currentRowNumber++; //Increase row number for count rows
	return dataInStream.readLine();
}
/**
 * Opening file for read via buffer.
 * Creation date: (29/12/2002 15:35:47)
 * @param FileName java.lang.String
 * @exception java.io.IOException The exception description.
 */
public void open(String fileName) throws java.io.IOException
{
	//Opening file for read
	fileInStream = new FileReader(fileName); 
	//Opening buffer for read
	dataInStream = new BufferedReader(fileInStream);
}
}