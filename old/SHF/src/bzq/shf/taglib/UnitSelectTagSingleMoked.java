/*
 * 
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Vector;

import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.TagSupport;

import org.apache.struts.util.ResponseUtils;

import bzq.forms.TableInfo;
import bzq.utils.TablesContainer;

/**
 * 
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class UnitSelectTagSingleMoked extends TagSupport {
	
	protected String mokedUnitId;
	protected String style;
	protected String logic;
	protected String name;
	protected String disabled;
	
	public int doStartTag() throws JspException {
		
		// start select tag		
		StringBuffer results = new StringBuffer("<select");
		
		if (!(name==null)) {
			results.append(" ");
			results.append("name=\""+name+"\" ");
			results.append(" ");
		}
		
		if (!(disabled==null)) {
			results.append(" ");
			results.append("disabled=\"disabled\" ");
			results.append(" ");
		}
		
		results.append(" dir=\"rtl\"");
		
		
		if (!(logic==null)) {
			results.append(" ");
			results.append(logic);
			results.append(" ");
		}
		
		if (!(style==null)) {
			results.append(" ");
			results.append("style=\""+style+"\" ");
			results.append(" ");
		}
		
		results.append(" >");
		results.append("\n");
		
		// start options tag	

		Vector table = getTable();
		
		if (table == null) {
			
			results.append("<option value=1>לא נמצאה טבלה");
			results.append("</option>");
			results.append("\n");
			
		} else {
			
			results.append("<option value=\"-1\">הכל</option>\n");
			
			TableInfo tableInfo;
			for (int i=0; i<table.size(); i++){
				tableInfo = (TableInfo)table.elementAt(i);
				if (tableInfo.getCode().equals(mokedUnitId)) {
					results.append("<option value="+tableInfo.getCode()+" "+(disabled == null ? "selected=\"selected\"" : "")+">"+tableInfo.getDescription()+"</option>\n");
				}
			}
		}
		
		// end select tag	
		results.append("</select>");
		
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}
	
	protected Vector getTable() {
		TablesContainer tablesContainer = 
			(TablesContainer) pageContext.getServletContext().getAttribute(bzq.utils.AppConstants.TABLES_KEY);
		return ((Vector) tablesContainer.getTable("unitCode"));
	}
	
	
	public String getMokedUnitId() {
		return mokedUnitId;
	}

	public void setMokedUnitId(String mokedUnitId) {
		this.mokedUnitId = mokedUnitId;
	}


	public String getStyle() {
		return style;
	}


	public void setStyle(String style) {
		this.style = style;
	}


	public String getLogic() {
		return logic;
	}


	public void setLogic(String logic) {
		this.logic = logic;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDisabled() {
		return disabled;
	}

	public void setDisabled(String disabled) {
		this.disabled = disabled;
	}
	
}
