/*
 * Created on 22/12/2004
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.utils;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * @author 30610488
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class FileProcessor
{
	/**
	 * Moving source file to other location 
	 * @param dest from file
	 * @param source to file
	 */
	public static void fileMovie(String dest, String source) throws IOException
	{
		new File(dest).renameTo(new File(source));
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
}
