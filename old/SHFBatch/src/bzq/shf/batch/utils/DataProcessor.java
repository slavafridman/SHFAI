package bzq.shf.batch.utils;
import java.io.File;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/**
 * Insert the type's description here.
 * Creation date: (05/05/2003 13:59:44)
 * @author: Eduard Katcherovski
 */
public class DataProcessor
{
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 11:14:09)
	 */
	public DataProcessor()
	{
		super();
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (12/07/2004 14:21:33)
	 * @return java.lang.String
	 * @param ch char
	 */
	public static String cutFirstChar(String str, String ch)
	{
		if (str != null && str.length() > 1 && str.startsWith(ch))
			return str.substring(1);
		return str;
	}

	/**
	 * Getting alfanumeric part of string after first no numeric sign ("123ab15" return "ab15").
	 * Creation date: (15/01/2004 14:27:11)
	 * @return java.lang.String
	 * @param param java.lang.String
	 */
	public static String getAlfaNumericPartOfString(String param)
	{
		String result = null;
		char[] chrArr = param.toCharArray();
		for (int i = 0; i < chrArr.length; i++)
		{
			if (!Character.isDigit(chrArr[i]))
			{
				result = param.substring(i, chrArr.length);
				break;
			}
		}
		return result;
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (11/08/2003 12:36:39)
	 * @return java.lang.String
	 */
	public static String getFormatedDate()
	{
		//Calendar rightNow = java.util.Calendar.getInstance();
		Calendar rightNow = new GregorianCalendar(TimeZone.getDefault());
		StringBuffer s = new StringBuffer();
		String day = Integer.toString(rightNow.get(Calendar.DAY_OF_MONTH));
		String month = Integer.toString(rightNow.get(Calendar.MONTH));
		String year = Integer.toString(rightNow.get(Calendar.YEAR));
		String hours = Integer.toString(rightNow.get(Calendar.HOUR_OF_DAY));
		String minutes = Integer.toString(rightNow.get(Calendar.MINUTE));
		String seconds = Integer.toString(rightNow.get(Calendar.SECOND));
		s.append(day);
		s.append("/");
		s.append(month);
		s.append("/");
		s.append(year);
		s.append(" ");
		s.append(hours);
		s.append(":");
		s.append(minutes);
		s.append(":");
		s.append(seconds);
		return s.toString();
	}
	/**
	 * Getting numeric part of string before first no numeric sign ("123ab15" return "123").
	 * Creation date: (15/01/2004 14:27:11)
	 * @return java.lang.String
	 * @param param java.lang.String
	 */
	public static Integer getNumericPartOfString(String param)
	{
		char[] chrArr = param.toCharArray();
		for (int i = 0; i < chrArr.length; i++)
		{
			if (!Character.isDigit(chrArr[i]))
			{
				param = param.substring(0, i);
				break;
			}
		}
		if (org.apache.commons.validator.GenericValidator.isBlankOrNull(param))
			return null;
		return new Integer(Integer.parseInt(param));
	}
	/**
	 * Insert the method's description here.
	 * Creation date: (24/09/2003 10:15:04)
	 * @return java.lang.String
	 * @param param java.lang.String
	 */
	public static String repairStr(String str, String searchStr)
	{
		if (str == null || str.indexOf(searchStr) > -1)
		{
			return "";
		}
		else
		{
			return str;
		}
	}
	public static long getFileSizeInBytes(String path)
	{
		File file = new File(path);
		return file.length();
	}

}
