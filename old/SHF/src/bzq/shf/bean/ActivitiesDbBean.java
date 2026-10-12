/*
 * Created on 17/11/2010
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ActivitiesDbBean extends ShfBaseBean{

	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		
		fieldsMapping.put("ACTIVITY_TYPE_ID","activityCode");
		fieldsMapping.put("ACTIVITY_TYPE_NAME","activityName");
		fieldsMapping.put("SHORT_NAME","shortName");
		fieldsMapping.put("SITE_ID","siteId");
		fieldsMapping.put("VIRTUAL_ACTIVITY_ID","virtualActivityCode");
	}
	
	protected long activityCode;
	protected String activityName;
	protected String shortName;
	protected int siteId;
	protected String virtualActivityCode;
	

	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}
	
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	public long getActivityCode() {
		return activityCode;
	}

	public void setActivityCode(long activityCode) {
		this.activityCode = activityCode;
	}

	public String getActivityName() {
		return activityName;
	}

	public void setActivityName(String activityName) {
		this.activityName = activityName;
	}

	public String getShortName() {
		return shortName;
	}

	public void setShortName(String shortName) {
		this.shortName = shortName;
	}

	public int getSiteId() {
		return siteId;
	}

	public void setSiteId(int siteId) {
		this.siteId = siteId;
	}

	public String getVirtualActivityCode() {
		return virtualActivityCode;
	}

	public void setVirtualActivityCode(String virtualActivityCode) {
		this.virtualActivityCode = virtualActivityCode;
	}

}
