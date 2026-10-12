package bzq.shf.utils; 
import org.apache.log4j.Logger;import bzq.db.DBAccess;import bzq.db.DBException;

public class DBResource {
	private static Logger logger = Logger.getLogger(DBResource.class);
	public static long getNextSequence(String sequenceName) throws ShfException{
		logger.debug("begining of DBResource.getNextSequence()");
		DBAccess dbAccess = null; 
		long generatedID = 0;
		try {
			dbAccess = new DBAccess(); 
			StringBuffer sql = new StringBuffer();
			sql.append("select " + sequenceName + ".NEXTVAL as NEW_ID from dual");
			dbAccess.prepareStatement(sql.toString());
			dbAccess.executeQuery();
			generatedID = dbAccess.getLong(1);
		} catch (DBException e) {
			logger.error(e.getMessage());
			throw new ShfException("DBResource.getNextSequence() error", e);
		}finally {
			try{
				dbAccess.close();
			}catch (Exception e){
				logger.error(e.toString());
			}
		}
		return generatedID;
	}	/*	public static Date getCurrentTime(){		logger.debug("begining of DBResource.getCurrentTime()");		DBAccess dbAccess = null; 		Date currentTime = null;		try {			dbAccess = new DBAccess(); 			StringBuffer sql = new StringBuffer();			sql.append("SELECT SYSDATE FROM DUAL");			dbAccess.prepareStatement(sql.toString());			dbAccess.executeQuery();			currentTime = dbAccess.getTimestamp(1);		}catch(DBException e){			return new Date();		}finally{			try{				dbAccess.close();			}catch (Exception e){				logger.error(e.toString());			}		}		return currentTime;	}*/
	}
