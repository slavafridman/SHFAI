package bzq.shf.utils;

import java.util.Vector;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.shf.forms.FormsConstants;

/**
 * Insert the type's description here.
 * Creation date: (27/01/2002 14:50:02)
 * @author: Administrator
 */
public class CodeTable {
	protected java.lang.String codeName;
	protected java.lang.String descriptionName;
	protected java.lang.String tableName;
	
	private bzq.forms.TableInfo tableInfo;
	public final static java.lang.String CODE_NOT_FOUND = "shf.tables.codeNotFound";
	private static Logger logger = Logger.getLogger(CodeTable.class);

	
/**
 * Table constructor comment.
 */
public CodeTable() {
	super();
}
/**
 * Insert the method's description here.
 * Creation date: (07/05/2002 14:45:55)
 * @param tableForm bzq.forms.TableForm
 * @param tableName java.lang.String
 */
public CodeTable(bzq.forms.TableInfo tableInfo, String tableName,String codeName,String descriptionName) {
	this.tableInfo = tableInfo;
	this.codeName =codeName;
	this.tableName = tableName;
	this.descriptionName = descriptionName;
	
	}
/**
 * Insert the method's description here.
 * Creation date: (03/03/2002 13:36:10)
 * @param tableName java.lang.String
 * @param codeName java.lang.String
 * @param descriptionName java.lang.String
 */
public CodeTable(String tableName, String codeName, String descriptionName) {
	this.codeName =codeName;
	this.tableName = tableName;
	this.descriptionName = descriptionName;
}
/**
 * Insert the method's description here.
 * Creation date: (15/01/2002 11:15:04)
 */
public void add() throws bzq.db.DBException {
			
	//validateCodeTable();
	DBAccess dbAccess = new DBAccess();
		
try {

	StringBuffer sql = new StringBuffer();

	sql.append("INSERT INTO " + tableName );
	sql.append(" ( " + codeName + " , " + descriptionName  + " ) ");
	sql.append(" VALUES ( ?,? ) ");
	
    dbAccess.prepareStatement(sql.toString()); 

    // set parameters
	dbAccess.setString(1, tableInfo.getCode());
	dbAccess.setString(2, tableInfo.getDescription());
		 
    dbAccess.executeUpdate();
	
} finally {
    dbAccess.close();
}

}
/**
 * Insert the method's description here.
 * Creation date: (15/01/2002 11:15:04)
 */
public void add(String sequenceName) throws bzq.db.DBException
{
	//validateCodeTable();
	DBAccess dbAccess = new DBAccess();
	try
	{
		StringBuffer sql = new StringBuffer();
		sql.append("INSERT INTO " + tableName);
		sql.append(" ( " + codeName + " , " + descriptionName + " ) ");
		sql.append(" VALUES ( " + sequenceName + ".NEXTVAL , ? ) ");
		
		dbAccess.prepareStatement(sql.toString());
		// set parameters
		
		dbAccess.setString(1, tableInfo.getDescription());
		dbAccess.executeUpdate();
	}
	finally
	{
		dbAccess.close();
	}
}
/**
 * Insert the method's description here.
 * Creation date: (15/01/2002 11:15:04)
 */
public void erase() throws DBException {

	// validateCodeTable();
	DBAccess dbAccess = new DBAccess();
	
	StringBuffer sql = new StringBuffer();

	sql.append("DELETE FROM " + tableName );
	sql.append(" WHERE ( " + codeName + " = ? )" );
   
	try{
		logger.debug("Deleting " + tableInfo.getCode() + " from " + tableName);
		dbAccess.prepareStatement(sql.toString()); 
		dbAccess.setString(1, tableInfo.getCode());
	    dbAccess.executeUpdate();
   	} finally {
 	   try{
	        dbAccess.close();
		}catch (Exception e){
			e.printStackTrace();
		}
	}

}
/**
 * Insert the method's description here.
 * Creation date: (15/01/2002 11:15:04)
 */
public void get()  throws DBException, ShfException  {
	
	StringBuffer sql = new StringBuffer();
	
    sql.append("SELECT ");
    sql.append(codeName + " AS CODE , " +  descriptionName + " AS DESCRIPTION ");
	sql.append(" FROM " + tableName + " WHERE " + codeName + " = ?" );

	DBAccess dbAccess = null; 
	try{     
	    dbAccess = new DBAccess(); 
	    dbAccess.prepareStatement(sql.toString());
	    dbAccess.setString(1, tableInfo.getCode().trim());

 	    dbAccess.executeQuery();  
		dbAccess.populate(tableInfo);
		
	 } catch (bzq.db.DBQueryNoRowsException e) {
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add("codeTable", new ActionError(CODE_NOT_FOUND));	
		throw new ShfException(actionErrors);	
   	} finally {
 	  try{
	        dbAccess.close();
		}catch (Exception e){
			e.printStackTrace();
		}
	}


	}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:33:57)
 * @return java.lang.String
 */
public java.lang.String getCodeName() {
	return codeName;
}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:34:58)
 * @return java.lang.String
 */
public java.lang.String getDescriptionName() {
	return descriptionName;
}
/**
 * Insert the method's description here.
 * Creation date: (27/01/2002 14:53:58)
 * @return java.util.Vector
 * @param tableName java.lang.String
 * @param codeName java.lang.String
 * @param descriptionName java.lang.String
 * @exception bzq.db.DBException The exception description.
 */
public java.util.Vector getRows() throws DBException  {

    String sql ="SELECT ";
    sql+= codeName + " AS CODE , " +  descriptionName + " AS DESCRIPTION ";
	sql+= " FROM " + tableName + " ORDER BY " + descriptionName;
	return getRows(sql);
	
}
/**
 * Insert the method's description here.
 * Creation date: (27/01/2002 14:53:58)
 * @return java.util.Vector
 * @param sql java.lang.String
 * @exception bzq.db.DBException The exception description.
 */
public java.util.Vector getRows(String sql) throws bzq.db.DBException {

	Vector table = new Vector();
    DBAccess dbAccess = null;
	try{
    	dbAccess = new DBAccess();
	    dbAccess.prepareStatement(sql); 
		dbAccess.executeQuery();
		dbAccess.populate(FormsConstants.CODE_TABLE , table );
    } finally {
        dbAccess.close();
    }
	return table;
}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:35:40)
 * @return java.lang.String
 */
public java.lang.String getTableName() {
	return tableName;
}
/**
 * Insert the method's description here.
 * Creation date: (15/01/2002 11:15:04)
 */
public void modify() throws DBException  {

	//validateCodeTable();
	DBAccess dbAccess = null;
	
	StringBuffer sql = new StringBuffer();
	
	sql.append("UPDATE " + tableName );
	sql.append(" SET " + descriptionName  + "= ? ");
	sql.append(" WHERE (" + codeName +  " = ?) ");

    try {
		dbAccess = new DBAccess();
	    dbAccess.prepareStatement(sql.toString()); 
		dbAccess.setString(1, tableInfo.getDescription() );
		dbAccess.setString(2, tableInfo.getCode());
		
	    dbAccess.executeUpdate();

    } finally {
        try{
	        dbAccess.close();
		}catch (Exception e){
			e.printStackTrace();
		}
    }
    
}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:33:57)
 * @param newCodeName java.lang.String
 */
public void setCodeName(java.lang.String newCodeName) {
	codeName = newCodeName;
}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:34:58)
 * @param newDescriptionName java.lang.String
 */
public void setDescriptionName(java.lang.String newDescriptionName) {
	descriptionName = newDescriptionName;
}
/**
 * Insert the method's description here.
 * Creation date: (02/05/2002 14:35:40)
 * @param newTableName java.lang.String
 */
public void setTableName(java.lang.String newTableName) {
	tableName = newTableName;
}
}
