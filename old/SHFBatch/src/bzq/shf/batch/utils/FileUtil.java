/*
 * Created on 15/12/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.utils;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.Arrays;
import java.util.Comparator;

/**
 * @author Gil Dahary
 * @version 1.6
 * 
 * this utility implement set of methods to handle files and directories
 * in a more convenient way.
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class FileUtil {

	private static final int BUFFER_SIZE = 2097152; //2MB
	/** The Decimal presentiation for the ASCII Line-feed. */
	public static final byte LINE_FEED = 10;
	/** The Decimal presentiation for the ASCII Carriage-return. */
	public static final byte CARRIAGE_RETURN = 13;

	/**
	 * This function get a list of files in the directory and return them.
	 * @param dirName - the directory name.
	 * @return String[] - the content of the directory as string array.
	 */
	public String[] getDirContent(String dirName) throws Exception {
		File file = new File(dirName);
		return file.list();
	}

	/**
	* This function get a directory name and a file name and check if the file already contain in that directory.
	* @param targetDir the directory name.
	* @param fileName the file name to searched.
	* @return boolean - true if file was founded, false if not.
	*/
	public boolean isFileExistInDir(String targetDir, String fileName)
		throws Exception {
		String[] dirContent = getDirContent(targetDir);
		for (int i = 0; i < dirContent.length; i++)
			if (dirContent[i].equalsIgnoreCase(fileName))
				return true;
		return false;
	}

	/**
	* This function get a directory name and check if its empty (i.e. no files found)
	* @param targetDir the directory name.
	* @return boolean - true if directory is empty, false if not.
	*/
	public boolean isDirectoryEmpty(String targetDir) throws Exception {
		if (getDirContent(targetDir).length == 0)
			return true;
		return false;
	}

	/**
	 * Reads a file from the disk into a byte array.
	 * @param filename - The name of the file to read.
	 * @return byte[] - byte array of the file's content.
	 */
	public byte[] readFile(String filename) throws Exception {
		try {
			File file = new File(filename);
			if (!file.isFile())
				return null;
			byte[] buffer = new byte[BUFFER_SIZE];
			int readLength = 0;
			FileInputStream fin = new FileInputStream(filename);
			int destPosition = 0;
			byte[] returnValue = new byte[fin.available()];
			while ((readLength = fin.read(buffer)) != -1) {
				System.arraycopy(
					buffer,
					0,
					returnValue,
					destPosition,
					readLength);
				destPosition += readLength;
			}
			fin.close();
			return returnValue;
		} catch (Exception e) {
			throw new Exception("Error reading file " + filename + " Error: " + e.getMessage());
		} catch (Throwable t) {
			throw new Exception("Error reading file " + filename + " Error: " + t.getMessage());
		}
	}
	
	/**
   * Gets the file without x lines from the begin and y lines in the end of the file.
   * If "\n" is not found, the whole data is returned.
   * @param data The file data.
   * @return array of bytes without the lines.
   */
  public static synchronized byte[] getPartFileContent(byte[] data, int fromLine, int toLine) throws Exception {
	  int from = getPositionFromBegin(data, fromLine);
	  int to = getPositionFromEnd(data, toLine);
	  int len = data.length - from - to;
	  try {
		  if (len > 0) {
			  byte []content = new byte[len];
			  for (int i = 0 ; i < len ; i++)
				  content[i] = data[from + i];
			  return content;
		  }
		  return null;
	  } catch (Throwable t) {
		throw new Exception("Error reading from file Error: " + t.getMessage());
	  }
  }
  
  /**
   * This function get a data as byte array and a number that represent the number of lines.
   * It count the number of lines in the file(byte array) and return the
   * requested position.
   */
  public static synchronized int getPositionFromBegin(byte[] data, int fromLine) {
	 int idx = 0;
	 for (int i = 0 ;i < fromLine ; i++) {
		 while ((idx < data.length - 1) && (data[idx] != CARRIAGE_RETURN) && (data[idx + 1] != LINE_FEED))
			 idx++;
		 idx = idx + 2;
	 }
	return idx;
  }

  /**
   * This function get a data as byte array and a number that represent the number of lines.
   * It count the number of lines from the end in the file(byte array) and it return the
   * requested position from the end.
   */
  public static synchronized int getPositionFromEnd(byte[] data, int toLine) {
	 int idx = data.length - 1;
	 for (int i = data.length ;i > data.length - toLine ; i--) {
		 while ((idx > 1) && (data[idx-1] != CARRIAGE_RETURN) && (data[idx] != LINE_FEED))
			 idx--;
		 idx = idx - 2;
	 }
	return data.length - idx -1;
  }


  /**
   * Writes a file to the disk.
   * @param filename The name of the output file.
   * @param data The file data.
   */
  public void writeFile(String filename, byte[] data) throws Exception {
	  try {
		  FileOutputStream fos = new FileOutputStream(filename);
		  fos.write(data);
		  fos.close();
	  } catch (Exception e) {
		throw new Exception("Error writing file"+filename+" Error: " + e.getMessage());
	  }
  }

/**
 * Append a file to an exist file and remove its empty lines.
 * @param filename The name of the output file.
 * @param data The file data.
 */
public void appendFile(String filename, byte[] data) throws Exception {
	int realSize = editEmptyLines(data);
	// shrink the empty lines from the file data and return its real size.
	try {
		FileOutputStream fos = new FileOutputStream(filename, true);
		fos.write(data, 0, realSize); // read only the real size.
		
		byte[] ln = null;
		if(isWindows()){
			ln = new byte[2];
			ln[0] = CARRIAGE_RETURN;
			ln[1] = LINE_FEED;
		}else{
			ln = new byte[1];
			ln[0] = LINE_FEED;
		}
		
		fos.write(ln); // add a new line in the end of the file.
		fos.close();
	} catch (Exception e) {
		throw new Exception("Error appending (writing) to file"+filename+" Error: "+e.getMessage());
	}
}

/**
 * @return boolean indication. true if current OS is windows, false if not windows (e.g. linux/UNIX)
 */
private boolean isWindows() {
	String os = System.getProperty("os.name").toUpperCase();
	if(os.startsWith("WINDOWS")) return true;
	return false;
}


  /**
   * This function get an array of byte and it order the array in a way that
   * it doesnt contain an empty lines. It erase the new lines in the begin of the file.
   * It tells us if the new array end with new line or not.
   * @param data the file in bytes array.
   * @return a number that represent the number of bytes that we should read from that array.
   */
  public int editEmptyLines(byte[] data) {
	  int interval  = 0; //the inteval that the 'new lines' bytes create.
	  while((interval + 1 < data.length) && (data[interval] == CARRIAGE_RETURN) && (data[interval + 1] == LINE_FEED))// check the number of empty lines in the begin of the file.
		  interval = interval + 2;
	  for (int i = 0 ; i < data.length ; i++) {// running all over the array.
		  if(i + interval + 4 > data.length) {// in case that we are in the 3 (or 2) last bytes.
			  for (int x = i + interval ; x < data.length; x++) {// just copy the 3 (or 2) last bytes
				  data[i] = data[x];
				  i++;
			  }
			  break;
		  }
		  if( (data[i + interval] == CARRIAGE_RETURN) && (data[i + interval + 1] == LINE_FEED) && (data[i + interval + 2] == CARRIAGE_RETURN) && (data[i + interval + 3] == LINE_FEED) ) {// if i found an empty line.
			  while((i + interval + 3 < data.length) && (data[i + interval+ 2] == CARRIAGE_RETURN) && (data[i + interval + 3] == LINE_FEED)) // in case that we have more empty lines.
				  interval = interval + 2; // increasing the interval.
			  data[i] = CARRIAGE_RETURN;
			  i++;
			  data[i] = LINE_FEED;//we add a new line.
		  }
		  else {
			  data[i] = data[i + interval]; // just copy (shrink) the value to a smaller position.
		  }
	  }
	  for (int i = data.length - interval ; i < data.length ; i++) // padding with zeros
		  data[i] ='\0';
	  if ((interval == 0) && (data[data.length - 1] != LINE_FEED)) // means that we should read all the file .
		  return data.length;
	  if ((data[data.length - interval - 2] == CARRIAGE_RETURN) && (data[data.length - interval - 1] == LINE_FEED))// if the array is ended with newLine we dont count it and we return the newsize without the newline bytes.
		  return data.length - interval - 2;
	  return data.length - interval;//just returning the new byte array size. we know that it doesnt end with new line bytes.
  }

	/**
	 * This function delete a file.
	 * @param fileName The name of the file to delete.
	 * @return true if succeed on deleting the file.
	 */
	public boolean deleteFile(String fileName) throws Exception {
		boolean retVal = false;
		try {
			File file = new File(fileName);
			retVal = file.delete();
		} catch (Exception e) {
			throw new Exception("Error deleting file"+fileName+" Error: "+ e.getMessage());
		} 
		return retVal;
	}

	/**
	 * this function extract a specific line as string from the file.
	 * It return the line with /r/n in the end (if there is only /n it add /r to be windows complaint)
	 * @param data - the file in bytes array.
	 * @param lineNum - number that represent the required line from the file.
	 * @return String - the required line from the file.
	 */
	public static synchronized String getLineBytes(byte[] data, int lineNum) {
		int fromIdx = 0;
		int toIdx = 0;
		for (int i = 0 ; i < lineNum ; i++) {
			fromIdx = toIdx;
			while((toIdx + 2) < data.length && (data[toIdx] != CARRIAGE_RETURN) && (data[toIdx + 1] != LINE_FEED)) {// look for new line.
				toIdx++;
			}
			toIdx = toIdx + 2;
		}
		int len = toIdx-fromIdx;
		if (len <= 0)
			return "";
		if (len == 1) {
			 byte [] retLine = new byte[2];
			 retLine[0] = CARRIAGE_RETURN;
			 retLine[1] = LINE_FEED;
			 return new String(retLine);
		}
		boolean flagUnix = false;
		if(toIdx < data.length && data[toIdx - 2] != CARRIAGE_RETURN) {
			flagUnix = true;
			len++;
		}

		byte [] retLine = new byte[len];
		for(int i = 0 ; i < len ; i++) {
			if(flagUnix && (i == len - 1))
				continue;
			retLine[i] = data[fromIdx + i];
		}
		if (flagUnix) {
			retLine[len - 2] = CARRIAGE_RETURN ;
			retLine[len - 1] = LINE_FEED ;
		}
		return new String(retLine);
	}


	/**
	 * this function extract a specific line as string from the file.
	 * @param data - the file in bytes array.
	 * @param lineNum - number that represent the required line from the file.
	 * @return String - the required line from the file.
	 */
	public static synchronized String getBinaryLineBytes(byte[] data, int lineNum) {
		int fromIdx = 0;
		int toIdx = 0;
		for (int i = 0 ; i < lineNum ; i++) {
			fromIdx = toIdx;
			while(data[toIdx] != LINE_FEED) {// look for new line.
				toIdx++;
			}
			toIdx = toIdx + 1;
		}
		int len = toIdx-fromIdx;
		if (len <= 0)
			return "";
		if (len == 1) {
			 byte [] retLine = new byte[1];
			 retLine[1] = LINE_FEED;
			 return new String(retLine);
		}

		byte [] retLine = new byte[len];
		for(int i = 0 ; i < len ; i++) {
			if(i == len - 1)
				continue;
			retLine[i] = data[fromIdx + i];
		}
		return new String(retLine);
	}


	/**
	 * This function get an array of bytes (files) and count the number of lines.
	 * @param data - the file in bytes array.
	 * @return int - the number of lines in the file
	 */
	public static synchronized int getNumOfLines(byte[] data, boolean modeBinary) {
		int counter = 1;
		for (int i = 0 ; i < data.length ; i++) {
			 if (i == data.length - 1)
					break;
			 if (modeBinary) {
			   //if ((data[i] == CARRIAGE_RETURN) && (data[i + 1] == LINE_FEED)) {
				if (data[i + 1] == LINE_FEED){
					counter++;
					i++;
				}
			} else {
				if ((data[i] == CARRIAGE_RETURN) && (data[i + 1] == LINE_FEED)) {
					counter++;
					i++;
				}
			}
		}
		 //increase the counter if a line is not ending with LINE_FEED because it reaches END OF FILE
		 if(data.length > 0 && data[data.length-1] != LINE_FEED){
			 counter++;
		 }

		return counter;
	}

	/**
	 * this function append a line(data) to a file (filename) at the end and add new line.
	 * @param filename - the file that we append the new line to.
	 * @param data - the line in bytes array.
	 */
	public void appendLine(String filename, byte[] data, boolean addNewLine) throws Exception {
		try {
			FileOutputStream fos = new FileOutputStream(filename, true);
			fos.write(data);
			if(addNewLine) {
				byte [] newLine = null;
				if(isWindows()){
					newLine = new byte[2];
					newLine[0] = CARRIAGE_RETURN;
					newLine[1] = LINE_FEED;
				}else{
					newLine = new byte[1];
					newLine[0] = LINE_FEED;
				}
				fos.write(newLine);
			}
			fos.close();
		} catch (Exception e) {
			e.printStackTrace();
			throw new Exception("Error appending (writing) to file"+filename+" Error: "+e.getMessage());
		}
	}


	/**
	 * this function overwrite the data in a file in a spesific position.
	 * @param fileName - the file to be overwrite.
	 * @param newData - the data that we are going to add.
	 * @param seekPosition - the position in the file that we overwrite with the newData.
	 */
	public void overWriteData(String fileName, String newData, long seekPosition) throws Exception {
		try {
			File f = new File(fileName);
			RandomAccessFile random = new RandomAccessFile(f, "rw");
			byte [] dataInBytes = newData.getBytes();
			random.seek(seekPosition);
			random.write(dataInBytes, 0, dataInBytes.length);
			random.close();
		} catch (Exception e) {
			throw new Exception("Error over writing file content of file "+fileName+" Error: "+e.getMessage());		
		}
	}
	
	/**
	 * this function extracts and return the file extension, usefull for determing file type
	 * @param fileName - the file name.
	 * @return String - the file extension
	 */
	public static String getFileExtension(String fileName) {
		String ext = null;
		String s = fileName;
		int i = s.lastIndexOf('.');

		if (i > 0 &&  i < s.length() - 1) {
			ext = s.substring(i+1);
		}
		return ext;
	}

	/**
	 * this function extracts and return the file extension, usefull for determing file type
	 * @param f - the file object (includes the file name).
	 * @return String - the file extension
	 */
	public static String getFileExtension(File f) {
		return getFileExtension(f.getName());
	}
	
	/**
	 * this function sorts an array of files (e.g. directory content)
	 * @param String[] files - the array of file names
	 * @return String[] - the sorted array by name (starting from the lowest name value)
	 */
	public static String[] bubbleSortByName(String[] files) {
		for(int i=0; i<files.length; i++){
			for (int k=0; k<files.length-(1+i); k++){
				if(files[k].toUpperCase().compareTo(files[k+1].toUpperCase()) > 0){
				   swap(files, k, k+1);
				}
			}
		}
		return files;
	}
	
	
	/**
	 * this function sorts an array of files (e.g. directory content)
	 * @param String directoryPath - the sure path to the directory of the files
	 * @return File[] - the sorted array by date in descending order
	 */
	public static File[] bubbleSortByDateSedc(String directoryPath, boolean desc) throws Exception{
		File directory = new File(directoryPath);
		if(! directory.isDirectory()) throw new Exception("the path "+directoryPath+" is not a directory");
		
		FileFilter filter = new FileFilter(){
			public boolean accept(File file){
				return file.isFile();
			}
		};

		File[] files = directory.listFiles();
		if(files == null || files.length == 0) return null;

		Arrays.sort(files, new Comparator(){
			public int compare(Object file1, Object file2) {
				if(((File)file1).lastModified() > ((File)file2).lastModified()) return -1;
				else if (((File)file1).lastModified() < ((File)file2).lastModified()) return +1;
				else return 0;
			}
		}		
		);

		return files;
	}


	/**
	 * this function sorts an array of files (e.g. directory content)
	 * @param String directoryPath - the sure path to the directory of the files
	 * @return File[] - the sorted array by date in ascending order
	 */
	public static File[] bubbleSortByDateAsc(String directoryPath) throws Exception{
		File directory = new File(directoryPath);
		if(! directory.isDirectory()) throw new Exception("the path "+directoryPath+" is not a directory");
				
		FileFilter filter = new FileFilter(){
			public boolean accept(File file){
				return file.isFile();
			}
		};
		
		File[] files = directory.listFiles(filter);
		if(files == null || files.length == 0) return null;
				
		Arrays.sort(files, new Comparator()
		{
			public int compare(Object file1, Object file2) {
				if(((File)file1).lastModified() > ((File)file2).lastModified()) return +1;
				else if (((File)file1).lastModified() < ((File)file2).lastModified()) return -1;
				else return 0;
			}
		}		
		);

		return files;
	}

	private static void swap(String[] array, int k1, int k2){
		String temp = array[k1];
		array[k1] = array[k2];
		array[k2] = temp;
	}

	/**
	 * this function move file and rename it   'from' --> 'to'.
	 */
	public static boolean localMove(String from, String to) throws Exception {
		boolean retVal = true;
		try {
			File myFile = new File(from);
			retVal = myFile.renameTo(new File(to));
		} catch (Exception e) {
			throw new Exception("Error moving file from: "+from+"  to:"+to+"   Error: "+e.getMessage());		
		}
		return retVal;
	}

	/**
	 * Moving source file to other location 
	 * @param dest from file
	 * @param source to file
	 */
	public static void fileMovie(String from, String to) throws IOException
	{
		if((new File(to).isFile())){
			new File(to).delete();
		}
		new File(from).renameTo(new File(to));
	}

	/**
	 * Copying source file to other location
	 * @param dest from file
	 * @param source to file
	 */
	public static void fileCopy(String dest, String source) throws IOException
	{
		File file = new File(dest);
		File file1 = new File(source);
		InputStream in = new FileInputStream(file);
		OutputStream out = new FileOutputStream(file1);
		// Transfer bytes from in to out
		byte[] buf = new byte[1024];
		int len;
		while ((len = in.read(buf)) > 0)
		{
			out.write(buf, 0, len);
		}
		in.close();
		out.close();
	}

	/**
	 * this method adds leading zeros to a number
	 * @return String - the digits of the number with leading zeros
	 * @param number - int representation of the number to pad
	 * @param range - the length of the needed return string
	 */
	public static String padWithZeros(int number, int range) {
		String digits = "" + number;
		StringBuffer buf = new StringBuffer();
		for (int i = 0; i < (range - digits.length()); ++i) {
			buf.append("0");
		}
		buf.append(digits);
		return buf.toString();
	}
	
	/**
	 * this method adds leading zeros to a number
	 * @return String - the digits of the number with leading zeros
	 * @param number - long representation of the number to pad
	 * @param range - the length of the needed return string
	 */
	public static String padWithZeros(long number, int range) {
		String digits = "" + number;
		StringBuffer buf = new StringBuffer();
		for (int i = 0; i < (range - digits.length()); ++i) {
			buf.append("0");
		}
		buf.append(digits);
		return buf.toString();
	}
	
	
	
	public String getFileDirectory(String filename) throws Exception {
			return new File(filename).getPath();
	}
	
	public String getFileName(String filename) throws Exception {
		return new File(filename).getName();
	}
	
}
